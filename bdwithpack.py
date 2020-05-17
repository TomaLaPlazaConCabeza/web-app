# -*- coding: utf-8 -*-
'''
Created on September 22, 2018
@author: Andrew Abi-Mansour
'''

# !/usr/bin/python
# -*- coding: utf8 -*-
# -------------------------------------------------------------------------
#
#   A simple molecular dynamics solver that simulates the motion
#   of non-interacting particles in the canonical ensemble using
#   a Langevin thermostat.
#
# --------------------------------------------------------------------------
#
#   This program is free software: you can redistribute it and/or modify
#   it under the terms of the GNU General Public License as published by
#   the Free Software Foundation, either version 2 of the License, or
#   (at your option) any later version.

#   This program is distributed in the hope that it will be useful,
#   but WITHOUT ANY WARRANTY; without even the implied warranty of
#   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#   GNU General Public License for more details.

#   You should have received a copy of the GNU General Public License
#   along with this program.  If not, see <http://www.gnu.org/licenses/>.

# -------------------------------------------------------------------------

import numpy as np
import matplotlib.pylab as plt
import random
from typing import Any, Dict, List, Optional, Tuple
import matplotlib
import numpy as np
import pyproj
import shapely.ops
from descartes import PolygonPatch
from shapely.coords import CoordinateSequence
from shapely.geometry import LineString, Point, Polygon, box
from shapely.geometry import mapping as geojson_mapping

def generate_random(polygon: Polygon) -> Point:
    """Generate a random point inside a polygon."""
    # Get cartesian boundaries of polygon
    minx, miny, maxx, maxy = polygon.bounds
    # Create a random point inside a square defined by the cartesian boundaries
    pnt = Point(random.uniform(minx, maxx), random.uniform(miny, maxy))
    # Check for point being inside polygon. If not, generate another random point
    while not polygon.contains(pnt):
        pnt = Point(random.uniform(minx, maxx), random.uniform(miny, maxy))
    return pnt


def populate_square(
    ob: Polygon, iters: int = 1000, r: float = 20e-9, debug: bool = False
) -> np.ndarray:
    """Function to populate a polygon "ob" with disks of radius "r".
    It performs "iters" attemps of disk insertion.
    It returns an array of the coordinates of the inserted disk centers.

    :returns: numpy nx2-array of floats.
    """
    # Define array of points
    pts = np.zeros(shape=(iters, 2))
    # Initialize first point -- always accepted as it's the first!
    pts[0, :] = np.asarray(generate_random(ob))
    accept = 1
    # Do n=iters disk insert attempt
    # TODO: numba, and pre-compute generate_random
    for i in range(iters):
        #  Generate random point inside ob
        pts_temp = np.asarray(generate_random(ob))
        # Calculate cartesian difference
        #  between pts_temp and all existing points in pts array
        pts_diff = pts[:accept] - pts_temp
        # Perform overlap boolean check with all existing points in pts array
        euclid_bool = (pts_diff * pts_diff).sum(1) > 4 * r * r
        # Check that pts_temp doesn't overlap with any other
        if np.all(euclid_bool):
            # If all checks are positive, add point
            pts[accept, :] = pts_temp
            accept += 1
        # Print progress
        if debug and (i % int(iters / 10)) == 0:
            print(f"Attempt: {i+1} Accepted: {accept-1}")

    return pts[:accept, :]


# Define global physical constants
Avogadro = 6.02214086e23
Boltzmann = 1.38064852e-23

def wallHitCheck(pos, vels, box, natoms):
    """ This function enforces reflective boundary conditions.
    All particles that hit a wall  have their velocity updated
    in the opposite direction.
    @pos: atomic positions (ndarray)
    @vels: atomic velocity (ndarray, updated if collisions detected)
    @box: simulation box size (tuple)
    """
    
    
    crossed_x1= pos[:,0]<box[0][0]
    crossed_x2= pos[:,0]>box[0][1]
    crossed_y1= pos[:,1]<box[1][0]
    crossed_y2= pos[:,1]>box[1][1]
    
    pos[crossed_x1,0]=box[0][0]
    pos[crossed_x2,0]=box[0][1]
    pos[crossed_y1,1]=box[1][0]
    pos[crossed_y2,1]=box[1][1]
    
    vels[crossed_x1 | crossed_x2, 0] *= -1
    vels[crossed_y1 | crossed_y2, 1] *= -1
        
        

def integrate(pos, vels, forces, mass,  dt):
    """ A simple forward Euler integrator that moves the system in time 
    @pos: atomic positions (ndarray, updated)
    @vels: atomic velocity (ndarray, updated)
    """
    #this adds the new positions and the new vels to the pos and vels variables
    pos += vels * dt
    print(pos)
    vels += forces * dt / mass[np.newaxis].T
    
def computeForce(mass, vels, temp, visc, dt, radius2,pos):
    """ Computes the Langevin force for all particles
    @mass: particle mass (ndarray)
    @vels: particle velocities (ndarray)
    @temp: temperature (float)
    @visc: viscosity (float)
    @dt: simulation timestep (float)
    returns forces (ndarray)
    """

    natoms, ndims = vels.shape

    #this noise is the brownian stuff essentially
    sigma = np.sqrt(2.0 * temp * Boltzmann *(6*np.pi*visc*radius2)/dt)
    noise = np.random.randn(natoms, ndims) * sigma[np.newaxis].T
    
    
    wca=np.zeros((len(pos),2))
    for i in range(0,len(pos)-1):
        for j in range(i+1,len(pos)):
            dr=pos[i]-pos[j] #calculates the vector between the positions
            mag=np.linalg.norm(dr)
            if mag<radius2*2:
                wcaf=-24*1*Boltzmann*(2*((radius2*2/mag)**12)-((radius2*2/mag)**6))*dr/(mag**2) #inclusion of the dr makes it a vector breaks it up between the components.
                wca[i]=wca[i]+wcaf #forces in opposite directions
                wca[j]=wca[i]-wcaf
           

    force = - (vels * (6*np.pi*visc*radius2) )+ noise -wca
    
    return force

def removeCOM(pos, mass):
    """ Removes center of mass motion. This function is not used. """
    pos -= np.dot(mass, pos) / mass.sum()

def run(**args):
    """ This is the main function that solves Langevin's equations for
    a system of natoms usinga forward Euler scheme, and returns an output
    list that stores the time and the temperture.
    
    @natoms (int): number of particles
    @temp (float): temperature (in Kelvin)
    @mass (float): particle mass (in Kg)
    @visc (float): viscosity (Pa.seconds)
    @dt (float): simulation timestep (s)
    @nsteps (int): total number of steps the solver performs
    @box (tuple): simulation box size (in meters) of size dimensions x 2
    e.g. box = ((-1e-9, 1e-9), (-1e-9, 1e-9)) defines a 2D square
    @ofname (string): filename to write output to
    @freq (int): write output every 'freq' steps
    
    @[radius]: particle radius (for visualization)
    
    Returns a list (of size nsteps x 2) containing the time and temperature.
    
    """

    natoms, box, dt, temp = args['natoms'], args['box'], args['dt'], args['temp']
    mass, visc, nsteps   = args['mass'], args['visc'], args['steps']
    ofname, freq, radius = args['ofname'], args['freq'], args['radius']
    
    
    dim = len(box)
    

#defines the initial values here
    vels = np.random.rand(natoms,dim)*0.01
    mass = np.ones(natoms) * mass / Avogadro
    radius2=radius
    radius = np.ones(natoms) * radius
    step = 0

   
    finalpos=np.array([[],[]]).T

    while step <= nsteps:

        step += 1

        # Compute all forces
        forces = computeForce(mass, vels, temp, visc, dt, radius2,pos)

        # Move the system in time
        integrate(pos, vels, forces, mass, dt)

        # Check if any particle has collided with the wall
        wallHitCheck(pos,vels,box,natoms)

     
        
        if not step%freq:
            
            finalpos=np.concatenate((finalpos,np.array(pos)))       

#output here is of the temperature, not something we are intersted in
    return finalpos

if __name__ == '__main__':

   
    
    polygon=Polygon([(0, 0), (0, 5e-7), (5e-7, 5e-7), (5e-7, 0), (0, 0)])
    pos = populate_square(polygon, iters=30000)
   
    params = {
       'natoms': len(pos),
       'temp': 300,
       'mass': 5e8,
       'radius': 20e-9,
       'visc': 8.9e-4,
       'dt': 5e-8,
       'steps': 3000,
       'freq': 10,
       'box': ((0, 5e-7), (0, 5e-7)),
       'pos': pos,
       'ofname': 'test_colloid.dump'
       }

   
    
   
    
    output = run(**params)
   

    
#plotting the trajectories to check if it behaves as we want it to    
    for j in range(0,int(params["natoms"])):
        track=np.array([[],[]]).T
        for i in range(0,int(params["steps"]/params["freq"])):
            track=np.vstack((track,output[i*int(params["natoms"])+j,:]))
            plt.plot(track[:,0],track[:,1], 'b-') 
            plt.plot(track[:,0],track[:,1], '.r')
            axes = plt.gca()
            axes.set_xlim([params["box"][0][0],params["box"][0][1]])
            axes.set_ylim([params["box"][1][0],params["box"][1][1]])
            
            
            
    plt.figure(2)
    axes = plt.gca()
    axes.set_xlim([params["box"][0][0],params["box"][0][1]])
    axes.set_ylim([params["box"][1][0],params["box"][1][1]])
    for i in range(params["natoms"]*30,params["natoms"]*31):
        circle1=plt.Circle((output[i,0],output[i,1]), radius=20e-9)
        axes.add_artist(circle1)
                          
    

   

