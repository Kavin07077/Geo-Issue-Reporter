package com.geo.issue.controller;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import com.geo.issue.model.User;
import com.geo.issue.model.UserRole;
import com.geo.issue.payload.request.LoginRequest;
import com.geo.issue.payload.request.SignupRequest;
import com.geo.issue.payload.response.JwtResponse;
import com.geo.issue.payload.response.MessageResponse;
import com.geo.issue.repository.UserRepository;
import com.geo.issue.security.jwt.JwtUtils;
import com.geo.issue.security.services.UserDetailsImpl;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {

        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(401)
                    .body(new MessageResponse("Invalid username or password."));
        }

        SecurityContextHolder.getContext().setAuthentication(authentication);
        
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        // Block unapproved users
        if (!userDetails.isApproved()) {
            SecurityContextHolder.clearContext();
            return ResponseEntity.status(403)
                    .body(new MessageResponse("Your account is pending admin approval. Please wait."));
        }

        String jwt = jwtUtils.generateJwtToken(authentication);
        List<String> roles = userDetails.getAuthorities().stream()
                .map(item -> item.getAuthority())
                .collect(Collectors.toList());

        return ResponseEntity.ok(new JwtResponse(jwt, 
                                                 userDetails.getId(), 
                                                 userDetails.getUsername(), 
                                                 userDetails.getEmail(), 
                                                 roles));
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        if (userRepository.existsByUsername(signUpRequest.getUsername())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: Username is already taken!"));
        }

        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: Email is already in use!"));
        }

        // Create new user's account
        User user = new User();
        user.setUsername(signUpRequest.getUsername());
        user.setEmail(signUpRequest.getEmail());
        user.setFullName(signUpRequest.getFullName());
        user.setPasswordHash(encoder.encode(signUpRequest.getPassword()));
        user.setPhone(signUpRequest.getPhone());

        Set<String> strRoles = signUpRequest.getRole();
        UserRole role = UserRole.CITIZEN; // Default

        if (strRoles != null && !strRoles.isEmpty()) {
            String rolestr = strRoles.iterator().next(); // Take first role
            try {
                // expecting input like "admin", "staff"
                if (rolestr.equalsIgnoreCase("admin")) role = UserRole.ADMIN;
                else if (rolestr.equalsIgnoreCase("staff")) role = UserRole.STAFF;
            } catch (Exception e) {}
        }
        user.setRole(role);
        user.setApproved(true);

        userRepository.save(user);

        return ResponseEntity.ok(new MessageResponse("Registration successful! You can now log in."));
    }
}
