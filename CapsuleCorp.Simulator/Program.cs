using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading;
using System.Threading.Tasks;

using CapsuleCorp.Shared.Models;
namespace CapsuleCorp.Simulator
{
    class Program
    {
        private static readonly HttpClient _httpClient = new HttpClient();
        private static string _apiUrl = "https://localhost:6001/api/telemetria";

        private static readonly List<string> Fleet = new List<string> { "RMN-SPO-001", "RMN-RJO-002", "RMN-BHE-003", "RMN-CWB-004" };

        // ColeÃ§Ãµes dinÃ¢micas de falhas ativas
        private static readonly HashSet<string> ActiveCompressorFaults = new HashSet<string>();
        private static readonly HashSet<string> ActiveChillerFaults = new HashSet<string>();
        private static readonly HashSet<string> ActivePowerFaults = new HashSet<string>();
        private static readonly HashSet<string> ActiveClimateFaults = new HashSet<string>();

        private static readonly Dictionary<string, int> FaultStepCounters = new Dictionary<string, int>();

        // Assinaturas FÃ­sicas EstÃ¡ticas
        private static readonly double[] ProfileGradientCurrent = { 5.0, 120.0, 245.0, 245.0, 180.0, 15.0, 140.0, 210.0, 210.0, 90.0, 5.0, 230.0, 230.0, 110.0, 5.0 };
        private static readonly double[] ProfileCpuTemperature = { 42.5, 48.0, 59.5, 64.0, 61.5, 46.0, 53.0, 60.5, 65.0, 55.0, 44.0, 62.0, 66.0, 51.0, 43.0 };
        private static readonly double[] ProfileGantryVibration = { 0.02, 0.45, 1.12, 1.25, 0.88, 0.05, 0.62, 0.95, 1.05, 0.32, 0.02, 1.18, 1.30, 0.55, 0.02 };

        private static readonly double[] ProfileVesselPressure = { 2.1, 2.3, 2.6, 3.1, 3.8, 4.6, 5.5, 6.6, 7.8, 9.1 };
        private static readonly double[] ProfileLinePressure = { 260.0, 180.0, 95.0, 40.0, 15.0, 5.0, 2.0, 0.0, 0.0, 0.0 };
        private static readonly double[] ProfileMagnetKelvin = { 4.2, 4.21, 4.23, 4.26, 4.30, 4.36, 4.43, 4.52, 4.63, 4.75 };

        static async Task Main(string[] args)
        {
            foreach (var id in Fleet)
            {
                FaultStepCounters[id] = 0;
                _ = Task.Run(() => TelemetryExecutionLoop(id));
            }

            // Loop de renderizaÃ§Ã£o da interface do usuÃ¡rio
            while (true)
            {
                DesenharPainelConsole();

                var tecla = Console.ReadKey(true).Key;

                if (tecla >= ConsoleKey.D1 && tecla <= ConsoleKey.D4)
                {
                    int tipoFalha = (int)tecla - (int)ConsoleKey.D0;
                    string targetId = SelecionarEquipamento();

                    if (!string.IsNullOrEmpty(targetId))
                    {
                        AlternarFalha(tipoFalha, targetId);
                    }
                }
                else if (tecla == ConsoleKey.Escape)
                {
                    break;
                }
            }
        }

        private static void DesenharPainelConsole()
        {
            Console.Clear();
            Console.ForegroundColor = ConsoleColor.Cyan;
            Console.WriteLine("=========================================================");
            Console.WriteLine("    CAPSULE CORP - SIMULADOR IoT MEDTECH (MRI SYSTEM)    ");
            Console.WriteLine("=========================================================");
            Console.ResetColor();

            // Painel DinÃ¢mico que exibe o estado de cada mÃ¡quina para o PortfÃ³lio
            Console.WriteLine("\n--- MONITOR DE ESTADO DA FROTA AO VIVO ---");
            foreach (var id in Fleet)
            {
                List<string> falhasAtivas = new List<string>();
                if (ActiveCompressorFaults.Contains(id)) falhasAtivas.Add("Comp");
                if (ActiveChillerFaults.Contains(id)) falhasAtivas.Add("Chiller");
                if (ActivePowerFaults.Contains(id)) falhasAtivas.Add("RedeEletr");
                if (ActiveClimateFaults.Contains(id)) falhasAtivas.Add("HVAC");

                Console.Write($"Equipamento: {id} | Status: ");
                if (falhasAtivas.Count > 0)
                {
                    Console.ForegroundColor = ConsoleColor.Red;
                    Console.WriteLine($"ANOMALIA ({string.Join(", ", falhasAtivas)}) ðŸ”´");
                }
                else
                {
                    Console.ForegroundColor = ConsoleColor.Green;
                    Console.WriteLine("OPERACIONAL MISTO ðŸŸ¢");
                }
                Console.ResetColor();
            }

            Console.ForegroundColor = ConsoleColor.Gray;
            Console.WriteLine("\n---------------------------------------------------------");
            Console.WriteLine("InjeÃ§Ã£o de Anomalias - Selecione a falha desejada:");
            Console.WriteLine("[1] Falha CrÃ­tica de Compressor (Fervura de HÃ©lio)");
            Console.WriteLine("[2] InterrupÃ§Ã£o de Fluxo no Chiller");
            Console.WriteLine("[3] FlutuaÃ§Ã£o ElÃ©trica na Rede TrifÃ¡sica");
            Console.WriteLine("[4] Falha de ClimatizaÃ§Ã£o na Sala HVAC");
            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.WriteLine("[ESC] Encerrar Simulador");
            Console.ForegroundColor = ConsoleColor.Gray;
            Console.WriteLine("---------------------------------------------------------");
            Console.Write("Escolha uma opÃ§Ã£o (1-4): ");
            Console.ResetColor();
        }

        private static string SelecionarEquipamento()
        {
            Console.WriteLine("\n\nSelecione o nÃºmero da mÃ¡quina alvo:");
            for (int i = 0; i < Fleet.Count; i++)
            {
                Console.WriteLine($"[{i + 1}] {Fleet[i]}");
            }
            Console.Write("NÃºmero: ");

            var entrada = Console.ReadKey(true).Key;

            // Mapeamento correto independente do teclado numÃ©rico lateral ou superior
            int index = -1;
            if (entrada >= ConsoleKey.D1 && entrada <= ConsoleKey.D4) index = entrada - ConsoleKey.D1;
            else if (entrada >= ConsoleKey.NumPad1 && entrada <= ConsoleKey.NumPad4) index = entrada - ConsoleKey.NumPad1;

            if (index >= 0 && index < Fleet.Count)
            {
                return Fleet[index];
            }

            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.WriteLine("\nâš ï¸ SeleÃ§Ã£o invÃ¡lida. Retornando ao menu...");
            Thread.Sleep(1200);
            Console.ResetColor();
            return string.Empty;
        }

        private static void AlternarFalha(int tipoFalha, string equipmentId)
        {
            switch (tipoFalha)
            {
                case 1:
                    if (ActiveCompressorFaults.Contains(equipmentId))
                    {
                        ActiveCompressorFaults.Remove(equipmentId);
                        FaultStepCounters[equipmentId] = 0;
                    }
                    else
                    {
                        ActiveCompressorFaults.Add(equipmentId);
                    }
                    break;
                case 2:
                    AlternarEstadoNaColecao(ActiveChillerFaults, equipmentId);
                    break;
                case 3:
                    AlternarEstadoNaColecao(ActivePowerFaults, equipmentId);
                    break;
                case 4:
                    AlternarEstadoNaColecao(ActiveClimateFaults, equipmentId);
                    break;
            }
        }

        private static void AlternarEstadoNaColecao(HashSet<string> colecao, string id)
        {
            if (colecao.Contains(id)) colecao.Remove(id);
            else colecao.Add(id);
        }

        private static async Task TelemetryExecutionLoop(string equipmentId)
        {
            var rand = new Random(equipmentId.GetHashCode());
            int examStepIndex = rand.Next(0, ProfileGradientCurrent.Length);

            double heliumLevel = 91.40;
            double chillerFlow = 52.5;
            double storageFree = 84.50;
            double currentRoomTemp = 19.8;
            double currentRoomHumidity = 46.5;

            while (true)
            {
                string overallStatus = "Operational";
                string compressorStatus = "Normal";

                double currentVoltage = 380 + rand.Next(-2, 3);
                double currentCpuTemp = 41.5 + (rand.NextDouble() * 0.8);
                double currentGradientCurrent = 0.0;
                double currentGantryVibration = 0.012;
                double currentLinePressure = 258.5;
                double currentVesselPressure = 2.15;
                double currentMagnetKelvin = 4.20;

                storageFree -= 0.002;
                if (storageFree < 12) storageFree = 92.0;

                bool isScanningDefault = (equipmentId == "RMN-SPO-001") || (equipmentId == "RMN-CWB-004" && (DateTime.UtcNow.Minute % 4) < 2);

                if (isScanningDefault && !ActiveCompressorFaults.Contains(equipmentId))
                {
                    currentCpuTemp = ProfileCpuTemperature[examStepIndex];
                    currentGradientCurrent = ProfileGradientCurrent[examStepIndex];
                    currentGantryVibration = ProfileGantryVibration[examStepIndex];
                    examStepIndex = (examStepIndex + 1) % ProfileGradientCurrent.Length;
                }

                // 1. Falha de Compressor
                if (ActiveCompressorFaults.Contains(equipmentId))
                {
                    overallStatus = "Critical";
                    compressorStatus = "Fault";

                    int currentStep = FaultStepCounters[equipmentId];
                    currentLinePressure = ProfileLinePressure[currentStep];
                    currentVesselPressure = ProfileVesselPressure[currentStep];
                    currentMagnetKelvin = ProfileMagnetKelvin[currentStep];
                    heliumLevel -= 0.08;

                    if (currentStep < ProfileVesselPressure.Length - 1) FaultStepCounters[equipmentId]++;
                }

                // 2. Falha de Chiller
                if (ActiveChillerFaults.Contains(equipmentId))
                {
                    overallStatus = overallStatus == "Critical" ? "Critical" : "Alert";
                    chillerFlow = Math.Max(4.5, chillerFlow - 7.5);
                    currentCpuTemp = 76.2 + rand.Next(0, 3);
                    if (chillerFlow < 15)
                    {
                        compressorStatus = "Fault";
                        currentLinePressure = 115.0;
                        currentVesselPressure = 3.6;
                    }
                }
                else
                {
                    chillerFlow = Math.Min(52.5, chillerFlow + 5.0);
                }

                // 3. Instabilidade ElÃ©trica
                if (ActivePowerFaults.Contains(equipmentId))
                {
                    overallStatus = overallStatus == "Critical" ? "Critical" : "Alert";
                    currentVoltage = rand.Next(0, 2) == 0 ? 338 : 422;
                    currentCpuTemp += 3.5;
                }

                // 4. Falha de HVAC
                if (ActiveClimateFaults.Contains(equipmentId))
                {
                    currentRoomTemp = Math.Min(32.5, currentRoomTemp + 0.8);
                    currentRoomHumidity = Math.Min(82.0, currentRoomHumidity + 2.0);
                    overallStatus = (currentRoomHumidity > 70 || currentRoomTemp > 28) ? "Critical" : "Alert";
                }
                else
                {
                    if (currentRoomTemp > 19.8) currentRoomTemp -= 0.4;
                    if (currentRoomHumidity > 46.5) currentRoomHumidity -= 1.0;
                }

                var payload = new ResonanceTelemetry
                {
                    EquipmentId = equipmentId,
                    Timestamp = DateTime.UtcNow,
                    OverallStatus = overallStatus,
                    HostCpuTemperatureCelsius = Math.Round(currentCpuTemp, 1),
                    HostStorageFreePercentage = Math.Round(storageFree, 2),
                    PowerSupplyVoltage = currentVoltage,
                    GradientCurrentAmperes = Math.Round(currentGradientCurrent, 1),
                    MagnetHeliumLevelPercentage = Math.Round(heliumLevel, 2),
                    MagnetCompressorLinePressurePsi = Math.Round(currentLinePressure, 1),
                    MagnetVesselHeliumPressurePsi = Math.Round(currentVesselPressure, 2),
                    MagnetTemperatureKelvin = Math.Round(currentMagnetKelvin, 2),
                    MagnetCompressorStatus = compressorStatus,
                    GantryVibrationG = Math.Round(currentGantryVibration, 3),
                    RoomTemperatureCelsius = Math.Round(currentRoomTemp, 1),
                    RoomHumidityPercentage = Math.Round(currentRoomHumidity, 1),
                    ChillerWaterFlowLpm = Math.Round(chillerFlow, 1)
                };

                try
                {
                    await _httpClient.PostAsJsonAsync(_apiUrl, payload);
                }
                catch { /* TransmissÃ£o em segundo plano mantida em silÃªncio */ }

                await Task.Delay(2000);
            }
        }
    }
}
