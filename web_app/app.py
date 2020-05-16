import flask

from .api import blueprint

app = flask.Flask(__name__)
app.register_blueprint(blueprint, url_prefix="/api")


@app.route("/")
def main_route() -> flask.Response:
    return flask.render_template("index.html")


@app.errorhandler(404)
def redirect_to_main(err) -> flask.Response:
    """Whenever we reach a 404, we simply redirect to root.
    """
    return flask.redirect(flask.url_for("main_route"))
