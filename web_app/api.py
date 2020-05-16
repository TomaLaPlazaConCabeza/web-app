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
                            100,
                            0
                        ],
                        [
                            200,
                            0
                        ],
                        [
                            101,
                            100
                        ],
                        [
                            100,
                            -100
                        ],
                        [
                            100,
                            0
                        ]
                    ]
                ]
            }
        }
    ]
}
"""
import flask
from shapely.geometry import mapping as geojson_mapping

from .algorithm import calculate, polygon_from_geosjon_feature

blueprint = flask.Blueprint("api", __name__)


@blueprint.route("/calculate", methods=["POST"])
def calculate_endpoint():
    """Endpoint that receives a GEOJSON encoded polygon (or list of polygons).

    Returns a GeoJSON encoded list of points.

    We expect the geojson coordinates to be encoded in WGS84 format.

    :return:
    """
    body = flask.request.get_json()  # TODO this may fail if request body is empty

    if "features" not in body:
        flask.abort(400)

    all_polygons = [
        item
        for item in body["features"]
        if item.get("geometry", {}).get("type") == "Polygon"
    ]

    if not all_polygons:
        points = []
    else:
        polygon = polygon_from_geosjon_feature(
            all_polygons[0]
        )  # FIXME: only taking first one for now
        # FIXME do conversion to meters here :-).
        _, raw_points = calculate(polygon)
        points = [
            {"type": "Feature", "geometry": geojson_mapping(point)}
            for point in raw_points
        ]

    return flask.jsonify(
        {
            "type": "FeatureCollection",
            "features": points,
            "properties": {"n_humans": len(points)},
        }
    )
