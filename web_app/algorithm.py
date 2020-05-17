import dataclasses
import random
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pyproj
import shapely.ops
import shapely.speedups
from descartes import PolygonPatch
from shapely.coords import CoordinateSequence
from shapely.geometry import LineString, Point, Polygon, box
from shapely.geometry import mapping as geojson_mapping

from .exceptions import CoordSystemInconsistency, NotAPolygon, OutsideSupportedArea

if shapely.speedups.available:
    shapely.speedups.enable()


BLUE = "#6699cc"
GRAY = "#999999"
RED = "#8B0000"
GREEN = "#32CD32"

# all mappings are FROM WGS84, epsg:4326
# all mappings are to coordinate systems measured in meters.
global_proj = pyproj.Proj("epsg:4326")
TRANSFORMER_MAPPING: Dict[str, pyproj.Transformer] = {
    "epsg:3035": pyproj.Transformer.from_proj(
        global_proj, pyproj.Proj("epsg:3035")
    ),  # most of europe
    "epsg:5634": pyproj.Transformer.from_proj(
        global_proj, pyproj.Proj("epsg:5634")
    ),  # canaries
    "epsg:6269": pyproj.Transformer.from_proj(
        global_proj, pyproj.Proj("epsg:8826")
    ),  # contiguous usa and canada
}

REVERSE_TRANSFORMER_MAPPING: Dict[str, pyproj.Transformer] = {
    "epsg:3035": pyproj.Transformer.from_proj(
        pyproj.Proj("epsg:3035"), global_proj
    ),  # most of europe
    "epsg:5634": pyproj.Transformer.from_proj(
        pyproj.Proj("epsg:5634"), global_proj
    ),  # canaries
    "epsg:6269": pyproj.Transformer.from_proj(
        pyproj.Proj("epsg:8826"), global_proj
    ),  # contiguous usa and canada
}
# BOUNDING BOXES IN WGS84
BOUNDING_BOX_MAP = {
    "epsg:3035": Polygon(
        [(-16.1, 32.88), (-16.1, 84.17), (40.18, 84.17), (40.18, 32.88)]
    ),
    "epsg:5634": Polygon(
        [(-21.73, 24.6), (-21.73, 32.76), (-11.75, 32.76), (-11.75, 24.6)]
    ),
}

# maximum supported size is 15 hectares.
MAX_SUPPORTED_SIZE = 1.5e5  # in m^2.


@dataclasses.dataclass
class CalculationResult:
    n_humans: int
    points: List[Point]
    inner_polygon: Polygon
    outer_polygon: Optional[Polygon] = None


def polygon_from_geosjon_feature(feature: Dict[str, Any]) -> Polygon:
    """Construct a polygon from a geojson feature

    :param feature: feature
    :return: Polygon
    """
    coordinates = feature.get("geometry", {}).get("coordinates", [])
    if not coordinates:
        raise NotAPolygon("No coordinates supplied")
    # geojson nests stuff even more.
    if len(coordinates[0]) < 3:
        raise NotAPolygon("Cannot construct a polygon with less than 3 tuples.")
    return Polygon(coordinates[0])


def polygons_from_geojson_features(
    main_polygon_feature: Dict[str, Any], hole_polygon_features: List[Dict[str, Any]]
) -> List[Polygon]:
    """Generate coordinate sequences from a main feature and hole features.

    :param main_polygon_feature: the geojson feature that contains the main polygon.
    :param hole_polygon_features: List of geojson features that contain hole polygons.
    :return: list of coordinate sequences, the first is always the main feature,
        all remaining are the holes
    """
    return [polygon_from_geosjon_feature(main_polygon_feature)] + [
        polygon_from_geosjon_feature(f) for f in hole_polygon_features
    ]


def convert_wgs84_to_meter_system(polygon: Polygon) -> Tuple[str, Polygon]:
    """Convert a polygon in WGS84 to a polygon in a meter-based
        coordinate system.

    :param polygon: the polygon to be converted

    :return: name of coordinate system used, another polygon.
    """
    # first check canaries
    if polygon.within(BOUNDING_BOX_MAP["epsg:5634"]):
        return (
            "epsg:5634",
            shapely.ops.transform(TRANSFORMER_MAPPING["epsg:5634"].transform, polygon),
        )
    # then europe as whole
    if polygon.within(BOUNDING_BOX_MAP["epsg:3035"]):
        return (
            "epsg:3035",
            shapely.ops.transform(TRANSFORMER_MAPPING["epsg:3035"].transform, polygon),
        )

    raise OutsideSupportedArea("Could not convert to a meter-based coordinate system")


def multi_convert_to_meter_system(polygons: List[Polygon]) -> Tuple[str, List[Polygon]]:
    """Convert mutiple polygons to a meter based system

    :param polygons: polygons to be converted
    :raises: CoordSystemInconsistency: when the individually
        detected coordinate systems are different.
    :raises: NotAPolygon, when items is < 1
    :raises: OutsideSupportedArea, when any of the items is outside supported area.
    :return: name of coordinate system used, converted polygons
    """
    if not polygons:
        raise NotAPolygon("Must supply at least 1 item")

    first_coord, first_conv = convert_wgs84_to_meter_system(polygons[0])

    if len(polygons) == 1:
        return first_coord, [first_conv]

    other_coords, other_conv = [], []

    for other_polygon in polygons[1:]:
        other_co, other_cv = convert_wgs84_to_meter_system(other_polygon)
        other_coords.append(other_co)
        other_conv.append(other_cv)

    if not all(o == first_coord for o in other_coords):
        raise CoordSystemInconsistency("Detected multiple coordinate systems.")

    all_conv = [first_conv] + other_conv

    return first_coord, all_conv


def create_composite_polygon(polygons: List[Polygon]):
    """Create composite polygons out of a list of polygons.

    :param polygons: Polygons. Must have at least one item.
        All other items are considered to be holes.

    :return: Composite polygon.
    """
    # Get the "bounding" polygon
    bounding_poly = polygons[0]
    # Get holes / obstacles
    if len(polygons) > 1:
        # Generate union of holes
        holes = polygons[1:]
        holes = shapely.ops.unary_union(holes)
        bounding_poly = bounding_poly.difference(holes)
    return bounding_poly


def metered_points_to_geojson(
    points: List[Point], coordinate_system: str, polygon_id: int
) -> List[Dict[str, Any]]:
    """List of metered points to geojson object

    :param points: list of points
    :param coordinate_system: coordinate system
    :param: polygon id this point refers to.
    :return: geojson in WGS84.
    """
    return [
        {
            "type": "Feature",
            "geometry": geojson_mapping(
                shapely.ops.transform(
                    REVERSE_TRANSFORMER_MAPPING[coordinate_system].transform, point
                )
            ),
            "properties": {"polygon_id": polygon_id, "type": "marker"},
        }
        for point in points
    ]


def polygon_to_geojson(
    polygon: Polygon, coordinate_system: str, polygon_id: int, inner=True
):
    return {
        "type": "Feature",
        "geometry": geojson_mapping(
            shapely.ops.transform(
                REVERSE_TRANSFORMER_MAPPING[coordinate_system].transform, polygon
            )
        ),
        "properties": {"type": "inner" if inner else "outer", "polygon_id": polygon_id},
    }


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


def correct_line_intersection(coords: CoordinateSequence) -> Polygon:
    """Function that converts a list of 2D cartesian coordinates
    (importable into Shapely) into a closed Polygon.

     Coordinates are assumed to be in meters.
     It accounts for lines that potentially intersects.
    """
    # Generate LineString obj from coordinates
    polyline = LineString(coords)

    # Create tiny buffer region around polyline
    polyline_buffer = polyline.buffer(0.1)

    # Create bounding box of polyline_buffer
    bbox = box(*polyline_buffer.bounds)

    # Obtain a list of unconnected polygons by difference of bbox and polyline_buffer
    list_polygons = bbox.difference(polyline_buffer)

    # Valid polygon is the one with highest intersection area with original polygon
    polygon = max(list_polygons, key=lambda a: a.intersection(Polygon(polyline)).area)

    return polygon


def generate_random(
    minx: float, miny: float, maxx: float, maxy: float, polygon: Polygon
) -> Point:
    """Generate a random point inside a polygon."""
    # Create a random point inside a square defined by the cartesian boundaries
    pnt = Point(random.uniform(minx, maxx), random.uniform(miny, maxy))
    # Check for point being inside polygon. If not, generate another random point
    while not polygon.contains(pnt):
        pnt = Point(random.uniform(minx, maxx), random.uniform(miny, maxy))
    return pnt


def random_disk_insertion(
    n_iter: int, pts: np.ndarray, filtered: np.ndarray, r: float
) -> Tuple[int, np.ndarray]:
    """Random disk insertion.

    May at one point be optimized with numba, but couldn't get it to work for now.

    :param n_iter:
    :param pts:
    :param filtered:
    :param r:
    :return:
    """
    accept = 1
    for i in range(min(n_iter, filtered.shape[0])):
        #  Generate random point inside ob
        pts_temp = filtered[i, :]
        # Calculate cartesian difference
        #  between pts_temp and all existing points in pts array
        pts_diff = pts[:accept] - pts_temp
        # Perform overlap boolean check with all existing points in pts array
        euclid_bool = (pts_diff * pts_diff).sum(1) > 4 * r * r
        # euclid_bool = random_disk_insertion(pts_diff, r)
        # Check that pts_temp doesn't overlap with any other
        if np.all(euclid_bool):
            # If all checks are positive, add point
            pts[accept, :] = pts_temp
            accept += 1

    return accept, pts


def populate_square(
    polygon: Polygon, iters: int = 1000, r: float = 1.0, fudge_factor: int = 2,
) -> np.ndarray:
    """Function to populate a polygon "ob" with disks of radius "r".
    It performs "iters" attemps of disk insertion.
    It returns an array of the coordinates of the inserted disk centers.

    :returns: numpy nx2-array of floats.
    """
    # Define array of points
    minx, miny, maxx, maxy = polygon.bounds
    n_random = iters * fudge_factor
    random_arr_x = np.random.uniform(minx, maxx, n_random)
    random_arr_y = np.random.uniform(miny, maxy, n_random)
    random_arr = np.stack([random_arr_x, random_arr_y], axis=1)

    # TOOD: somehow make this listy thingy more vectorized.
    def mask_func(x):
        return polygon.contains(Point(x))

    mask = np.apply_along_axis(mask_func, axis=1, arr=random_arr)

    filtered = random_arr[mask, :]
    pts = np.zeros(shape=filtered.shape)
    accept, pts = random_disk_insertion(iters, pts, filtered, r)
    return pts[:accept, :]


def calculate(
    polygon: Polygon,
    n_iters: int = 5000,
    social_distance: float = 1.5,
    buffer_zone_size: Optional[float] = None,
) -> CalculationResult:
    """Do the math

    :param polygon: Polygon with coordinates in meters.
    :param social_distance: social distance in meters
    :param buffer_zone_size: size of buffer zone in meters.
    :return: n_points, coordinates
    """
    # If buffer zone is activated, generate buffer zone and substract it
    #  to initial polygon
    if buffer_zone_size is not None:
        outer_polygon = polygon.boundary.buffer(5)
        inner_polygon = polygon.difference(outer_polygon)
    else:
        inner_polygon = polygon
        outer_polygon = None

    # Random insertion of disks in polygon -- returns disks' centers coordinates
    # FIXME: guesstimate number of iters based on polygon area.
    disk_centers = populate_square(inner_polygon, iters=n_iters, r=social_distance)

    # Convert to disk polygons
    disks = [Point(i[0], i[1]) for i in disk_centers]

    return CalculationResult(len(disks), disks, inner_polygon, outer_polygon)


def calc_result_to_serializable(
    calc_result: CalculationResult, coord_system: str, polygon_id: int
) -> Dict[str, Any]:
    points = metered_points_to_geojson(calc_result.points, coord_system, polygon_id)
    inner_boundary = polygon_to_geojson(
        calc_result.inner_polygon, coord_system, polygon_id
    )

    features = points + [inner_boundary]

    if calc_result.outer_polygon is not None:
        features.append(
            polygon_to_geojson(
                calc_result.outer_polygon, coord_system, polygon_id, inner=False
            )
        )

    return {
        "type": "FeatureCollection",
        "features": features,
        "properties": {"n_humans": calc_result.n_humans},
    }


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
