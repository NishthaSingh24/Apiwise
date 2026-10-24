package com.apiwise.exception;

import org.springframework.http.HttpStatus;

public class SsrfException extends ApiException {
    public SsrfException(String message) {
        super("SSRF Protection Blocked Request: " + message, HttpStatus.FORBIDDEN);
    }
}
