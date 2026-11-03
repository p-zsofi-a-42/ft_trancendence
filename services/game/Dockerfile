FROM python:3.15.2-alpine3.24

WORKDIR /app

COPY ./requirements.txt /app/requirements.txt

RUN pip install --no-cache-dir --upgrade -r /app/requirements.txt

COPY ./srcs /app/srcs

EXPOSE 81

ENTRYPOINT ["fastapi", "run", "./srcs/main.py", "--port", "81"]
