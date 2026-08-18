FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

WORKDIR /src

COPY ["PsiAngel.slnx", "./"]
COPY ["Backend/Backend.csproj", "Backend/"]
COPY ["Backend.Tests/Backend.Tests.csproj", "Backend.Tests/"]
RUN dotnet restore "PsiAngel.slnx"

COPY . .
RUN dotnet test "Backend.Tests/Backend.Tests.csproj" -c Release
RUN dotnet publish "Backend/Backend.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
EXPOSE 8080

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Backend.dll"]