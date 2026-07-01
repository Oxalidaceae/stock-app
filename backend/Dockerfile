FROM eclipse-temurin:17-jdk-jammy AS build
WORKDIR /app
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw dependency:go-offline -q
COPY src ./src
RUN ./mvnw package -DskipTests -q

FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
# 힙을 절대값(-Xmx)으로 명시 캡. WSL2(cgroup v2, 커널 6.x) 환경에서 JVM 자동 컨테이너
# 메모리 감지가 mem_limit(2g)이 아닌 VM 전체 RAM을 읽는 사례가 있어 MaxRAMPercentage는 신뢰 불가.
# heap 1280m + metaspace 256m + 스레드/코드캐시 오버헤드 ≈ <2g (compose의 backend mem_limit과 정합).
ENTRYPOINT ["java", "-Xms256m", "-Xmx1280m", "-XX:MaxMetaspaceSize=256m", "-jar", "app.jar"]
