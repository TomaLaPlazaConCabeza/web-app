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


# Define global physical constants
Avogadro = 6.02214086e23
Boltzmann = 1.38064852e-23

def wallHitCheck(pos, vels, box):
    """ This function enforces reflective boundary conditions.
    All particles that hit a wall  have their velocity updated
    in the opposite direction.
    @pos: atomic positions (ndarray)
    @vels: atomic velocity (ndarray, updated if collisions detected)
    @box: simulation box size (tuple)
    """
    ndims = len(box)

    for i in range(ndims):
        vels[((pos[:,i] <= box[i][0]) | (pos[:,i] >= box[i][1])),i] *= -1

def integrate(pos, vels, forces, mass,  dt):
    """ A simple forward Euler integrator that moves the system in time 
    @pos: atomic positions (ndarray, updated)
    @vels: atomic velocity (ndarray, updated)
    """
    #this adds the new positions and the new vels to the pos and vels variables
    pos += vels * dt
    print(pos)
    vels += forces * dt / mass[np.newaxis].T
    
def computeForce(mass, vels, temp, visc, dt, radius2):
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
    sigma = np.sqrt(2.0 * mass * temp * Boltzmann / ((6*np.pi*visc*radius2)* dt))
    noise = np.random.randn(natoms, ndims) * sigma[np.newaxis].T

    force = - (vels * mass[np.newaxis].T) /(6*np.pi*visc*radius2) + noise
    
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
    pos = np.random.rand(natoms,dim)

    for i in range(dim):
        pos[:,i] = box[i][0] + (box[i][1] -  box[i][0]) * pos[:,i]
    print(pos)

#defines the initial values here
    vels = np.random.rand(natoms,dim)*10
    mass = np.ones(natoms) * mass / Avogadro
    radius2=radius
    radius = np.ones(natoms) * radius
    step = 0

   
    finalpos=np.array([[],[]]).T

    while step <= nsteps:

        step += 1

        # Compute all forces
        forces = computeForce(mass, vels, temp, visc, dt, radius2)

        # Move the system in time
        integrate(pos, vels, forces, mass, dt)

        # Check if any particle has collided with the wall
        wallHitCheck(pos,vels,box)

     
        
        if not step%freq:
            
            finalpos=np.concatenate((finalpos,np.array(pos)))       

#output here is of the temperature, not something we are intersted in
    return finalpos

if __name__ == '__main__':

    params = {
        'natoms': 70,
        'temp': 300,
        'mass': 1e1,
        'radius': 25e-9,
        'visc': 8.9e-4,
        'dt': 1e-11,
        'steps': 1000,
        'freq': 10,
        'box': ((0, 20e-8), (0, 20e-8)),
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
                               
    
        

    '''
    plt.plot(output[:,0] * 1e3, output[:,1])
    plt.xlabel('Time (ps)')
    plt.ylabel('Temp (K)')
    plt.show()
    '''
