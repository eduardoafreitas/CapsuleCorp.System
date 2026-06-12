using CapsuleCorp.Auth.API.Data;
using CapsuleCorp.Auth.Interfaces;
using CapsuleCorp.Auth.Services;
using CapsuleCorp.Auth.Workers;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Configurando PostgreSQL
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// CORS para desenvolvimento do frontend — permite credentials: true
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // necessário para cookies cross-site
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// DI (Injeção de Dependências)
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<RefreshTokenCleanupService>(); // Serviço de faxina

// Registra a tarefa em segundo plano (Background Task) buscando da pasta Workers
builder.Services.AddHostedService<TokenCleanupWorker>();

// Authentication: JwtBearer configurado de forma resiliente
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)),
        ClockSkew = TimeSpan.Zero // Zera a tolerância para bater com a configuração do Monitor.API
    };

    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            // 1. Tenta buscar do Cookie HttpOnly primeiro
            if (context.Request.Cookies.ContainsKey("access_token"))
            {
                context.Token = context.Request.Cookies["access_token"];
            }
            // 2. Fallback: Se não achou no cookie, lê o cabeçalho Bearer tradicional (LocalStorage)
            else if (context.Request.Headers.TryGetValue("Authorization", out var authHeader))
            {
                var bearerToken = authHeader.ToString();
                if (bearerToken.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                {
                    context.Token = bearerToken.Substring("Bearer ".Length).Trim();
                }
            }
            return Task.CompletedTask;
        }
    };
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();