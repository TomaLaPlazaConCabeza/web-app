import flask

from .api import blueprint

app = flask.Flask(__name__)
app.register_blueprint(blueprint, url_prefix="/api")


@app.route("/")
def main_route():
    return flask.render_template("index.html")
