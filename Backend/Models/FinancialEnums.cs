namespace Backend.Models;

public enum PaymentType
{
    PerSession = 1,
    Package = 2
}

public enum Currency
{
    BRL = 1,
    USD = 2,
    EUR = 3
}

public enum PaymentMethod
{
    CreditCard = 1,
    Pix = 2,
    Cash = 3,
    Transfer = 4
}

public enum PackageType
{
    Monthly = 1,
    PerSessions = 2
}

public enum BillingStartDateType
{
    CurrentMonth = 1,
    CustomDate = 2
}
