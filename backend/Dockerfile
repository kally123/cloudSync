# Multi-stage build for Spring Boot application
FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /app

# Copy pom.xml and download dependencies (cached layer)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build
COPY src ./src

# Build argument to control test execution
ARG SKIP_TESTS=true

# Build the application
# Tests are skipped by default to reduce build time and avoid external dependencies
# Run tests in CI/CD pipeline before building the Docker image
# To run tests during build: docker build --build-arg SKIP_TESTS=false
RUN mvn clean package -DskipTests=${SKIP_TESTS}

# Production stage
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Copy the built JAR from build stage
COPY --from=build /app/target/*.jar app.jar

# Create directories for storage and data
RUN mkdir -p /app/storage /app/data

# Expose the application port
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
