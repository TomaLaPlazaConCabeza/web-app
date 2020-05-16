import flask

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
        points = []  # get points here.

    return flask.jsonify({"type": "FeatureCollection", "features": points})
