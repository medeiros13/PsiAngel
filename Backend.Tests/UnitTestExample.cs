using Moq;
using Xunit;

namespace Backend.Tests;

public class UnitTestExample
{
    [Fact]
    public void Test1()
    {
        // Arrange
        var mock = new Mock<IComparable>();
        mock.Setup(m => m.CompareTo(It.IsAny<object>())).Returns(0);

        // Act
        var result = mock.Object.CompareTo(new object());

        // Assert
        Assert.Equal(0, result);
    }
}
