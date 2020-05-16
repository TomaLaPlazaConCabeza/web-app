FROM python:3.8-slim

COPY web_app /web_app
COPY react-app /react-app
COPY requirements.txt /
COPY README.md /
COPY setup.py /
COPY LICENSE /
COPY AUTHORS /

RUN apt-get update && apt-get install -y curl gnupg \
 && curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - \
 && echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list \
 && apt-get update \
 && apt-get install -y yarn \
 && cd react-app \
 && yarn \
 && yarn build \
 && cd ../ \
 && pip install -r requirements.txt \
 && python setup.py install

CMD ["gunicorn", "--workers", "4", "--bind", "0.0.0.0:6000", "web_app.app:app"]
