package com.cloudsync.service;

import com.cloudsync.dto.AuthResponse;
import com.cloudsync.dto.LoginRequest;
import com.cloudsync.dto.RegisterRequest;
import com.cloudsync.entity.User;
import com.cloudsync.exception.UserAlreadyExistsException;
import com.cloudsync.repository.UserRepository;
import com.cloudsync.security.JwtTokenProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for handling user authentication and registration.
 * Manages JWT token generation and user credential validation.
 */
@Service
@Transactional
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       JwtTokenProvider jwtTokenProvider, AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.authenticationManager = authenticationManager;
    }

    /**
     * Registers a new user and returns authentication response with JWT token.
     * Validates username and email uniqueness before creating the user.
     */
    public AuthResponse register(RegisterRequest request) {
        validateNewUserCredentials(request);

        User user = new User(
                request.username(),
                request.email(),
                passwordEncoder.encode(request.password())
        );

        userRepository.save(user);
        
        log.info("User registered: username={}", request.username());

        // Auto-login after registration
        return login(new LoginRequest(request.username(), request.password()));
    }

    /**
     * Authenticates a user and returns JWT token.
     */
    public AuthResponse login(LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.username(),
                            request.password()
                    )
            );

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String token = jwtTokenProvider.generateToken(userDetails);

            User user = userRepository.findByUsername(request.username())
                    .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));

            log.debug("User logged in: username={}", request.username());

            return new AuthResponse(token, user.getUsername(), user.getEmail());

        } catch (BadCredentialsException e) {
            log.warn("Failed login attempt: username={}", request.username());
            throw new BadCredentialsException("Invalid username or password");
        }
    }

    /**
     * Retrieves the current user by username.
     */
    @Transactional(readOnly = true)
    public User getCurrentUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    // --- Private helper methods ---

    private void validateNewUserCredentials(RegisterRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            throw new UserAlreadyExistsException("Username already exists");
        }

        if (userRepository.existsByEmail(request.email())) {
            throw new UserAlreadyExistsException("Email already exists");
        }
    }
}
