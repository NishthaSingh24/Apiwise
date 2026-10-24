package com.apiwise.execution;

import com.apiwise.exception.SsrfException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.InetAddress;
import java.net.URI;
import java.net.UnknownHostException;
import java.util.Set;

@Service
public class SsrfProtectionService {

    private static final Logger log = LoggerFactory.getLogger(SsrfProtectionService.class);

    private final boolean allowLoopback;

    private static final Set<String> BLOCKED_HOSTNAMES = Set.of(
            "localhost",
            "metadata.google.internal",
            "instance-data",
            "169.254.169.254"
    );

    public SsrfProtectionService(@Value("${apiwise.security.allow-loopback:false}") boolean allowLoopback) {
        this.allowLoopback = allowLoopback;
    }

    public void validateUrl(String urlString) {
        if (urlString == null || urlString.isBlank()) {
            throw new SsrfException("URL cannot be empty");
        }

        URI uri;
        try {
            uri = URI.create(urlString.trim());
        } catch (IllegalArgumentException e) {
            throw new SsrfException("Malformed URL: " + e.getMessage());
        }

        String scheme = uri.getScheme();
        if (scheme == null || (!scheme.equalsIgnoreCase("http") && !scheme.equalsIgnoreCase("https"))) {
            throw new SsrfException("Only HTTP and HTTPS protocols are allowed (got: " + scheme + ")");
        }

        String host = uri.getHost();
        if (host == null || host.isBlank()) {
            throw new SsrfException("URL must contain a valid host");
        }

        String lowerHost = host.toLowerCase();

        if (!allowLoopback && BLOCKED_HOSTNAMES.contains(lowerHost)) {
            throw new SsrfException("Access to host '" + host + "' is prohibited by SSRF security policy");
        }

        try {
            InetAddress[] addresses = InetAddress.getAllByName(host);
            for (InetAddress address : addresses) {
                validateAddress(address);
            }
        } catch (UnknownHostException e) {
            throw new SsrfException("Cannot resolve host: " + host);
        }
    }

    private void validateAddress(InetAddress address) {
        if (allowLoopback) {
            return;
        }

        if (address.isLoopbackAddress()) {
            throw new SsrfException("Loopback addresses are blocked: " + address.getHostAddress());
        }

        if (address.isAnyLocalAddress()) {
            throw new SsrfException("Wildcard local addresses are blocked: " + address.getHostAddress());
        }

        if (address.isSiteLocalAddress()) {
            throw new SsrfException("Private RFC1918 addresses are blocked: " + address.getHostAddress());
        }

        if (address.isLinkLocalAddress()) {
            throw new SsrfException("Link-local addresses (including cloud metadata) are blocked: " + address.getHostAddress());
        }

        if (address.isMulticastAddress()) {
            throw new SsrfException("Multicast addresses are blocked: " + address.getHostAddress());
        }

        byte[] bytes = address.getAddress();
        if (bytes.length == 4) {
            int b0 = bytes[0] & 0xFF;
            int b1 = bytes[1] & 0xFF;

            // 10.0.0.0/8
            if (b0 == 10) {
                throw new SsrfException("Private IP range 10.0.0.0/8 is blocked");
            }
            // 172.16.0.0/12
            if (b0 == 172 && (b1 >= 16 && b1 <= 31)) {
                throw new SsrfException("Private IP range 172.16.0.0/12 is blocked");
            }
            // 192.168.0.0/16
            if (b0 == 192 && b1 == 168) {
                throw new SsrfException("Private IP range 192.168.0.0/16 is blocked");
            }
            // 169.254.0.0/16 (Link Local / Cloud Metadata)
            if (b0 == 169 && b1 == 254) {
                throw new SsrfException("Cloud metadata / link-local IP 169.254.0.0/16 is blocked");
            }
            // 0.0.0.0/8
            if (b0 == 0) {
                throw new SsrfException("Current network 0.0.0.0/8 is blocked");
            }
        }
    }
}
