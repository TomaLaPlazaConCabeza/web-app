FROM python:3.8-slim

COPY web_app /
COPY requirements.txt /
COPY README.md /
COPY setup.py /
COPY LICENSE /
COPY AUTHORS /

RUN pip install -r requirements.txt && python setup.py install

CMD ["gunicorn", "--workers", "4", "--bind", "0.0.0.0:6000", "web_app.app:app"]
