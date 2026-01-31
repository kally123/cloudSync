package com.cloudsync;

import com.cloudsync.dto.LoginRequest;
import com.cloudsync.dto.RegisterRequest;
import com.cloudsync.entity.User;
import com.cloudsync.repository.UserRepository;
import com.cloudsync.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AuthServiceTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Test
    void testRegister_Success() {
        RegisterRequest request = new RegisterRequest("testuser", "test@example.com", "password123");
        var response = authService.register(request);

        assertNotNull(response);
        assertNotNull(response.getToken());
        assertEquals("testuser", response.getUsername());
        assertEquals("test@example.com", response.getEmail());

        User savedUser = userRepository.findByUsername("testuser").orElse(null);
        assertNotNull(savedUser);
        assertEquals("test@example.com", savedUser.getEmail());
    }

    @Test
    void testLogin_Success() {
        // First register
        authService.register(new RegisterRequest("testuser", "test@example.com", "password123"));

        // Then login
        LoginRequest loginRequest = new LoginRequest("testuser", "password123");
        var response = authService.login(loginRequest);

        assertNotNull(response);
        assertNotNull(response.getToken());
        assertEquals("testuser", response.getUsername());
    }

    @Test
    void testLogin_InvalidCredentials() {
        authService.register(new RegisterRequest("testuser", "test@example.com", "password123"));

        LoginRequest loginRequest = new LoginRequest("testuser", "wrongpassword");
        assertThrows(BadCredentialsException.class, () -> authService.login(loginRequest));
    }
}
