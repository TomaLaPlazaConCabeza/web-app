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
    calculate,
    convert_wgs84_to_meter_system,
    correct_line_intersection,
    metered_points_to_geojson,
    polygon_from_geosjon_feature,
)

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

    if not all_polygons:
        points = []
        n_humans = 0
    else:
        # FIXME: only taking first one for now
        try:
            polygon = polygon_from_geosjon_feature(all_polygons[0])
        except ValueError:
            flask.abort(400, "Polygon contains too little items to compute.")
        coord_system, metered_polygon = convert_wgs84_to_meter_system(polygon)
        # fix for weird self-intersections
        n_humans, raw_points = calculate(
            correct_line_intersection(metered_polygon.exterior.coords)
        )
        points = metered_points_to_geojson(raw_points, coord_system)

    return flask.jsonify(
        {
            "type": "FeatureCollection",
            "features": points,
            "properties": {"n_humans": n_humans},
        }
    )
