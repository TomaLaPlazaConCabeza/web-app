import flask

app = flask.Flask(__name__)


@app.route("/")
def main_route():
    return flask.render_template("index.html")
