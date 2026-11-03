FROM python:3.15.2-alpine3.24 AS dev

WORKDIR /app

COPY ./requirements.txt /app/requirements.txt

RUN pip install --no-cache-dir --upgrade -r /app/requirements.txt

# TODO: remove
RUN pip install --no-cache-dir --upgrade sqlalchemy

COPY ./srcs /app/srcs

EXPOSE 8081

ENTRYPOINT ["fastapi", "run", "./srcs/main.py", "--port", "8081"]
