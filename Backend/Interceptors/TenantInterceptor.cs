using Backend.Services;
using Microsoft.EntityFrameworkCore.Diagnostics;
using System.Data.Common;

namespace Backend.Interceptors
{
    public class TenantInterceptor : DbConnectionInterceptor
    {
        private readonly ITenantProvider _tenantProvider;

        public TenantInterceptor(ITenantProvider tenantProvider)
        {
            _tenantProvider = tenantProvider;
        }

        public override async Task ConnectionOpenedAsync(DbConnection connection, ConnectionEndEventData eventData, CancellationToken cancellationToken = default)
        {
            await base.ConnectionOpenedAsync(connection, eventData, cancellationToken);
            await SetTenantIdAsync(connection);
        }

        public override void ConnectionOpened(DbConnection connection, ConnectionEndEventData eventData)
        {
            base.ConnectionOpened(connection, eventData);
            SetTenantId(connection);
        }

        private async Task SetTenantIdAsync(DbConnection connection)
        {
            var tenantId = _tenantProvider.TenantId;
            using var command = connection.CreateCommand();
            
            if (tenantId == Guid.Empty)
            {
                // Reset or set to a safe value to prevent leakage from connection pooling
                command.CommandText = "SET app.current_tenant = '';";
            }
            else
            {
                command.CommandText = $"SET app.current_tenant = '{tenantId}';";
            }
            
            await command.ExecuteNonQueryAsync();
        }

        private void SetTenantId(DbConnection connection)
        {
            var tenantId = _tenantProvider.TenantId;
            using var command = connection.CreateCommand();
            
            if (tenantId == Guid.Empty)
            {
                command.CommandText = "SET app.current_tenant = '';";
            }
            else
            {
                command.CommandText = $"SET app.current_tenant = '{tenantId}';";
            }
            
            command.ExecuteNonQuery();
        }
    }
}
