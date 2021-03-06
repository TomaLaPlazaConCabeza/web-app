import flask
from flask_cors import CORS

from .api import blueprint

app = flask.Flask(__name__)
CORS(app)

app.register_blueprint(blueprint, url_prefix="/api")


@app.route("/")
def main_route() -> flask.Response:
    return flask.render_template("index.html")


@app.errorhandler(404)
def redirect_to_main(err) -> flask.Response:
    """Whenever we reach a 404, we simply redirect to root.
    """
    return flask.redirect(flask.url_for("main_route"))


@app.errorhandler(400)
def handle_400(err) -> flask.Response:
    response = flask.jsonify({"message": err.description})
    response.status_code = 400
    return response


@app.errorhandler(500)
def handle_500(err) -> flask.Response:
    response = flask.jsonify({"message": err.description})
    response.status_code = 500
    return response
