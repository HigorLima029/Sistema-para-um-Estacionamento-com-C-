using EstacionamentoApi.Services;

var builder = WebApplication.CreateBuilder(args);

// Serviços
builder.Services.AddControllers();
builder.Services.AddSingleton<EstacionamentoService>();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS: libera o front-end React (Vite roda por padrão em http://localhost:5173)
const string PoliticaCors = "PermitirFrontend";
builder.Services.AddCors(options =>
{
    options.AddPolicy(PoliticaCors, policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors(PoliticaCors);
app.UseAuthorization();
app.MapControllers();

app.Run();
