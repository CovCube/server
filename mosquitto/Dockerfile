FROM eclipse-mosquitto:latest

COPY ./passwords /mosquitto

RUN mosquitto_passwd -U /mosquitto/passwords