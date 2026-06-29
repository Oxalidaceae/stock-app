FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw dependency:go-offline -q
COPY src ./src
RUN ./mvnw package -DskipTests -q

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
# 컨테이너 mem_limit(2g)의 70%를 최대 힙으로 — docker-compose의 backend mem_limit과 함께 동작.
# mem_limit이 없으면 호스트(WSL2 VM) 전체를 기준 삼으니 반드시 둘을 같이 설정할 것.
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=70", "-XX:MaxMetaspaceSize=256m", "-jar", "app.jar"]
