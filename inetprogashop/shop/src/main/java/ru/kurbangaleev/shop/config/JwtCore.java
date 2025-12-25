package ru.kurbangaleev.shop.config;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;
import java.util.Date;
import java.util.Map;
import javax.crypto.SecretKey;

@Component
public class JwtCore {
    private final SecretKey key = Keys.secretKeyFor(SignatureAlgorithm.HS256);
    private final int lifetime = 86400000; // 24 часа

    // Теперь принимаем еще и role
    public String generateToken(String username, String role) {
        return Jwts.builder()
                .setSubject(username)
                .addClaims(Map.of("role", role))
                .setIssuedAt(new Date())
                .setExpiration(new Date((new Date()).getTime() + lifetime))
                .signWith(key)
                .compact();
    }

    public String getNameFromJwt(String token) {
        return Jwts.parserBuilder().setSigningKey(key).build()
                .parseClaimsJws(token).getBody().getSubject();
    }

    public String getRoleFromJwt(String token) {
        return Jwts.parserBuilder().setSigningKey(key).build()
                .parseClaimsJws(token).getBody().get("role", String.class);
    }
}