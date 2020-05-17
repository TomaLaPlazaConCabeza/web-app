"""
Example input to calculate endpoint:

{
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [
                    [
                        [
                            -16.817703,
                            28.365476
                        ],
                        [
                            -16.817043,
                            28.3654
                        ],
                        [
                            -16.81706,
                            28.365689
                        ],
                        [
                            -16.817178,
                            28.365681
                        ],
                        [
                            -16.817471,
                            28.365681
                        ],
                        [
                            -16.817683,
                            28.365683
                        ],
                        [
                            -16.817703,
                            28.365476
                        ]
                    ]
                ]
            }
        }
    ]
}
"""

import flask

from .algorithm import (
    MAX_SUPPORTED_SIZE,
    calc_result_to_serializable,
    calculate,
    correct_line_intersection,
    create_composite_polygon,
    multi_convert_to_meter_system,
    polygons_from_geojson_features,
)
from .exceptions import CoordSystemInconsistency, NotAPolygon, OutsideSupportedArea

blueprint = flask.Blueprint("api", __name__)


@blueprint.route("/calculate", methods=["POST"])
def calculate_endpoint():
    """Endpoint that receives a GEOJSON encoded polygon (or list of polygons).

    Returns a GeoJSON encoded list of points.

    We expect the geojson coordinates to be encoded in WGS84 format.

    :return:
    """
    try:
        body = flask.request.get_json()
    except (TypeError, ValueError):
        flask.abort(400, "Request payload was not proper JSON.")

    if body is None:
        flask.abort(400, "Request body was not proper JSON")

    if "features" not in body:
        flask.abort(400, "There is no 'features' element inside the request payload.")

    all_polygons = [
        item
        for item in body["features"]
        if item.get("geometry", {}).get("type") == "Polygon"
    ]

    barrier_size: float = float(body.get("properties", {}).get("barrierSize", 0))
    social_distance_radius: float = float(
        body.get("properties", {}).get("personRadius", 1.5)
    )

    if not all_polygons:
        return flask.jsonify(
            {
                "type": "FeatureCollection",
                "features": [],
                "properties": {"n_humans": 0},
            }
        )

    main_polygons = [
        polygon
        for polygon in all_polygons
        if not polygon.get("properties", {}).get("hole", False)
    ]
    hole_polygons = [
        polygon
        for polygon in all_polygons
        if polygon.get("properties", {}).get("hole", False)
    ]

    # FIXME: only taking first one for now
    try:
        shapely_polygons = polygons_from_geojson_features(
            main_polygons[0], hole_polygons
        )
    except NotAPolygon:
        flask.abort(400, "You have drawn too few points.")

    polygon_id: int = main_polygons[0].get("properties", {}).get("id", 0)

    try:
        coord_system, metered_polygons = multi_convert_to_meter_system(shapely_polygons)
    except OutsideSupportedArea:
        flask.abort(
            400,
            (
                "Your location unfortunately resides outside "
                "supported area (most of Europe & Canary Islands)."
            ),
        )
    except CoordSystemInconsistency:
        flask.abort(400, "Obstacles were too far from the main area.")

    cleaned_polygons = [
        correct_line_intersection(metered_polygon.exterior.coords)
        for metered_polygon in metered_polygons
    ]
    composite_polygon = create_composite_polygon(cleaned_polygons)
    if composite_polygon.area > MAX_SUPPORTED_SIZE:
        flask.abort(
            400, "Your submitted area is larger than the maximum supported area."
        )

    calc_result = calculate(
        composite_polygon,
        social_distance=social_distance_radius,
        buffer_zone_size=barrier_size if not barrier_size <= 0 else None,
    )

    serializer = calc_result_to_serializable(calc_result, coord_system, polygon_id)

    return flask.jsonify(serializer)
