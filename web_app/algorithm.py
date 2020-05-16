import random
from typing import List, Optional, Tuple

import numpy as np
from descartes import PolygonPatch
from shapely.geometry import Point, Polygon
from tqdm import tqdm

BLUE = "#6699cc"
GRAY = "#999999"
RED = "#8B0000"
GREEN = "#32CD32"


def plot_line(ax, ob, color=BLUE):
    """Function to plot Shapely line object"""
    # Get objects x and y boundary as line
    x, y = ob.xy
    ax.plot(x, y, color=color, linewidth=3, solid_capstyle="round", zorder=1, alpha=0.5)


def plot_coords(ax, ob, color=GRAY):
    """Function to plot Shapely object coordinates"""
    # Get Shapely object point coords (e.g. polygon vertexes)
    coords = np.asarray(ob)
    #  If multiple points, scatter plot
    if coords.size > 2:
        ax.scatter(coords[:, 0], coords[:, 1], color=color)
    # If single, point plot
    else:
        ax.scatter(coords[0], coords[1], color=color)


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


def populate_square(ob: Polygon, iters: int = 1000, r: float = 1.0) -> np.ndarray:
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
    for i in tqdm(range(iters)):
        #  Generate random point inside ob
        pts_temp = np.asarray(generate_random(ob))
        # Calculate cartesian difference between pts_temp and all existing points in pts
        # array
        pts_diff = pts[:accept] - pts_temp
        # Perform overlap boolean check with all existing points in pts array
        euclid_bool = (pts_diff * pts_diff).sum(1) > 4 * r * r
        # Check that pts_temp doesn't overlap with any other
        if np.all(euclid_bool):
            # If all checks are positive, add point
            pts[accept, :] = pts_temp
            accept += 1
        # Print progress
        if (i % int(iters / 10)) == 0:
            print(f"Attempt: {i+1} Accepted: {accept-1}")

    return pts[:accept, :]


def calculate(
    polygon: Polygon, social_distance: float, buffer_zone_size: Optional[float] = None
) -> Tuple[int, List[Point]]:
    """Do the math

    :param polygon: Polygon with coordinates in meters.
    :param social_distance: social distance in meters
    :param buffer_zone_size: size of buffer zone in meters.
    :return: n_points, coordinates
    """
    # If buffer zone is activated, generate buffer zone and substract it
    #  to initial polygon
    if buffer_zone_size is not None:
        boundary = polygon.boundary.buffer(5)
        polygon = polygon.difference(boundary)

    # Random insertion of disks in polygon -- returns disks' centers coordinates
    disk_centers = populate_square(polygon, iters=30000, r=social_distance)

    # Convert to disk polygons
    disks = [Point(i[0], i[1]).buffer(social_distance) for i in disk_centers]

    return len(disks), disks


if __name__ == "__main__":
    import matplotlib.pyplot as plt

    # Generate polygon
    pts_ext = [(0, 0), (0, 50), (50, 50), (50, 0), (0, 0)]
    pts_int = [(25, 0), (12.5, 12.5), (25, 25), (37.5, 12.5), (25, 0)][::-1]
    polygon = Polygon(pts_ext, [pts_int])

    # Random insertion of disks in polygon -- returns disks' centers coordinates
    disk_centers = populate_square(polygon, iters=30000)
    # Convert to disk polygons
    disks = [Point(i[0], i[1]).buffer(1) for i in disk_centers]

    # Plotting
    fig = plt.figure(1, figsize=(10, 4), dpi=180)
    ax = fig.add_subplot(121, aspect="equal")

    plot_coords(ax, polygon.interiors[0])
    plot_coords(ax, polygon.exterior)
    patch = PolygonPatch(polygon, facecolor=BLUE, edgecolor=GRAY, alpha=0.5, zorder=2)
    ax.add_patch(patch)
    ax.set_title("No boundary")

    for i, disk in enumerate(disks):
        # plot_coords(ax, disk_centers[i])
        patch = PolygonPatch(disk, facecolor=RED, edgecolor=GRAY, alpha=0.5, zorder=2)
        ax.add_patch(patch)

    # Generate polygon boundary
    boundary = polygon.boundary.buffer(5)

    # Random insertion of disks in polygon with boundary zone substracted
    #  -- returns disks' centers coordinates
    disk_centers = populate_square(polygon.difference(boundary), iters=30000)
    # Convert to disk polygons
    disks = [Point(i[0], i[1]).buffer(1) for i in disk_centers]

    # Plotting
    fig = plt.figure(1, figsize=(10, 4), dpi=180)
    ax = fig.add_subplot(122, aspect="equal")

    plot_coords(ax, polygon.interiors[0])
    plot_coords(ax, polygon.exterior)
    patch = PolygonPatch(polygon, facecolor=BLUE, edgecolor=GRAY, alpha=0.5, zorder=2)
    ax.add_patch(patch)
    patch_b = PolygonPatch(
        boundary.intersection(polygon),
        facecolor=GREEN,
        edgecolor=GRAY,
        alpha=0.5,
        zorder=2,
    )
    ax.add_patch(patch_b)

    for i, disk in enumerate(disks):
        # plot_coords(ax, disk_centers[i])
        patch = PolygonPatch(disk, facecolor=RED, edgecolor=GRAY, alpha=0.5, zorder=2)
        ax.add_patch(patch)
    ax.set_title("With Boundary")
    plt.show()
