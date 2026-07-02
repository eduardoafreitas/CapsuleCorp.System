using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace CapsuleCorp.Monitor.API.Hubs
{
    [Authorize(Roles = "Admin,Editor,Viewer")]
    public class TelemetryHub : Hub
    {
        // Bidirectional telemetry commands can be added here when needed.
    }
}
