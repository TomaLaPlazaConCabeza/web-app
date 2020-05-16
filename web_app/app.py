import flask
from flask_cors import CORS

from .api import blueprint

app = flask.Flask(__name__)
CORS(app)

app.register_blueprint(blueprint, url_prefix="/api")


@app.route("/")
def main_route():
    return flask.render_template("index.html")
