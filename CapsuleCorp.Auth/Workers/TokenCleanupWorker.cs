using CapsuleCorp.Auth.Services;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace CapsuleCorp.Auth.Workers
{
    public class TokenCleanupWorker : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<TokenCleanupWorker> _logger;

        public TokenCleanupWorker(IServiceProvider serviceProvider, ILogger<TokenCleanupWorker> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Worker de limpeza de Tokens iniciado.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    // Abre um escopo temporário para usar o DbContext com segurança
                    using (var scope = _serviceProvider.CreateScope())
                    {
                        var cleanupService = scope.ServiceProvider.GetRequiredService<RefreshTokenCleanupService>();
                        await cleanupService.PurgeExpiredAsync();
                    }

                    _logger.LogInformation("Faxina de Refresh Tokens expirados concluída com sucesso.");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Erro ao tentar limpar tokens expirados.");
                }

                // Espera 24 horas antes de rodar novamente
                await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
            }
        }
    }
}