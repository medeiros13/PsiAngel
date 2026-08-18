using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;
using Microsoft.AspNetCore.Hosting;
using System.Threading.Tasks;
using System.Net;
using Microsoft.Extensions.Configuration;

namespace Backend.Tests;

public class IntegrationTestExample : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public IntegrationTestExample(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder => 
        {
            builder.UseEnvironment("Testing");
            builder.ConfigureAppConfiguration((context, config) =>
            {
                config.AddInMemoryCollection(new System.Collections.Generic.Dictionary<string, string?>
                {
                    { "JWT_SECRET", "super_secret_key_for_testing_purposes_only_1234567890" },
                    { "JWT_ISSUER", "test_issuer" },
                    { "JWT_AUDIENCE", "test_audience" }
                });
            });
        });
    }

    [Fact]
    public async Task HealthEndpoint_ReturnsOk()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/health");

        // Assert
        response.EnsureSuccessStatusCode(); // Status Code 200-299
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        
        var content = await response.Content.ReadAsStringAsync();
        Assert.Equal("Healthy", content);
    }
}
