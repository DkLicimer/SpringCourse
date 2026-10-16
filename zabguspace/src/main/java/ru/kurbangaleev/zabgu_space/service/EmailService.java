package ru.kurbangaleev.zabgu_space.service;

public interface EmailService {
    void sendSimpleMessage(String to, String subject, String text);
}