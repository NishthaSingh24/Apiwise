package com.apiwise.config;

import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
@ConditionalOnProperty(name = "DATABASE_URL")
public class RenderDataSourceConfig {

    private static final Logger log = LoggerFactory.getLogger(RenderDataSourceConfig.class);

    @Bean
    @Primary
    public DataSource dataSource(@Value("${DATABASE_URL}") String databaseUrl) {
        log.info("Configuring DataSource from DATABASE_URL environment variable");

        try {
            // Render can provide postgresql:// or postgres://
            String cleanUrl = databaseUrl.replaceFirst("^postgres://", "postgresql://");
            URI dbUri = new URI(cleanUrl);

            String userInfo = dbUri.getUserInfo();
            String username = "postgres";
            String password = "";

            if (userInfo != null && userInfo.contains(":")) {
                String[] parts = userInfo.split(":", 2);
                username = parts[0];
                password = parts[1];
            } else if (userInfo != null) {
                username = userInfo;
            }

            int port = dbUri.getPort() == -1 ? 5432 : dbUri.getPort();
            String host = dbUri.getHost();
            String path = dbUri.getPath();

            String jdbcUrl = "jdbc:postgresql://" + host + ":" + port + path;
            log.info("Constructed JDBC URL: jdbc:postgresql://{}:{}{}", host, port, path);

            HikariDataSource dataSource = new HikariDataSource();
            dataSource.setJdbcUrl(jdbcUrl);
            dataSource.setUsername(username);
            dataSource.setPassword(password);
            dataSource.setDriverClassName("org.postgresql.Driver");
            dataSource.setMaximumPoolSize(10);
            dataSource.setMinimumIdle(2);
            dataSource.setConnectionTimeout(20000);

            return dataSource;
        } catch (Exception e) {
            log.error("Failed to parse DATABASE_URL: {}", e.getMessage(), e);
            throw new IllegalStateException("Invalid DATABASE_URL configuration: " + e.getMessage(), e);
        }
    }
}
