# ============================================================================
# SSE Streaming Test Script for Tibyan AI Agent
# ============================================================================
# Tests /api/ai/agent endpoint with streaming enabled
# Verifies SSE format, delta delivery, and [DONE] marker

param(
    [string]$BaseUrl = "http://localhost:3000",
    [string]$Message = "Hello, test streaming",
    [int]$Timeout = 30
)

Write-Host "`n=== Tibyan AI Streaming Test ===" -ForegroundColor Cyan
Write-Host "URL: $BaseUrl/api/ai/agent" -ForegroundColor Gray
Write-Host "Message: $Message" -ForegroundColor Gray
Write-Host "Timeout: ${Timeout}s`n" -ForegroundColor Gray

# Prepare request body
$body = @{
    message = $Message
    sessionId = "test_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    history = @()
    stream = $true
} | ConvertTo-Json -Depth 10

Write-Host "[1/4] Sending POST request..." -ForegroundColor Yellow

try {
    # Create HttpClient for streaming
    $httpClient = New-Object System.Net.Http.HttpClient
    $httpClient.Timeout = [System.TimeSpan]::FromSeconds($Timeout)

    # Prepare request
    $request = New-Object System.Net.Http.HttpRequestMessage
    $request.Method = [System.Net.Http.HttpMethod]::Post
    $request.RequestUri = "$BaseUrl/api/ai/agent"
    $request.Content = New-Object System.Net.Http.StringContent($body, [System.Text.Encoding]::UTF8, "application/json")

    # Send request
    $response = $httpClient.SendAsync($request, [System.Net.Http.HttpCompletionOption]::ResponseHeadersRead).Result

    Write-Host "[2/4] Response received: $($response.StatusCode)" -ForegroundColor $(if ($response.IsSuccessStatusCode) { "Green" } else { "Red" })
    Write-Host "      Content-Type: $($response.Content.Headers.ContentType)" -ForegroundColor Gray

    if (-not $response.IsSuccessStatusCode) {
        $errorBody = $response.Content.ReadAsStringAsync().Result
        Write-Host "`nError: $errorBody" -ForegroundColor Red
        exit 1
    }

    # Verify SSE headers
    $contentType = $response.Content.Headers.ContentType.MediaType
    if ($contentType -ne "text/event-stream") {
        Write-Host "`n[WARNING] Content-Type is not text/event-stream: $contentType" -ForegroundColor Yellow
    } else {
        Write-Host "      SSE headers: OK" -ForegroundColor Green
    }

    Write-Host "`n[3/4] Reading SSE stream (first 10 events)..." -ForegroundColor Yellow

    # Read stream
    $stream = $response.Content.ReadAsStreamAsync().Result
    $reader = New-Object System.IO.StreamReader($stream)

    $eventCount = 0
    $deltaCount = 0
    $doneReceived = $false
    $content = ""

    while (-not $reader.EndOfStream) {
        $line = $reader.ReadLine()
        
        # Display first 10 events
        if ($eventCount -lt 10) {
            if ($line) {
                Write-Host "      $line" -ForegroundColor Gray
            }
        }

        # Parse SSE
        if ($line -match '^data: (.+)$') {
            $eventCount++
            $dataJson = $matches[1]

            if ($dataJson -eq "[DONE]") {
                $doneReceived = $true
                Write-Host "`n      [DONE] marker received!" -ForegroundColor Green
                break
            }

            try {
                $data = $dataJson | ConvertFrom-Json
                if ($data.delta) {
                    $deltaCount++
                    $content += $data.delta
                }
            } catch {
                # Ignore parse errors for metadata
            }
        }
    }

    $reader.Close()
    $httpClient.Dispose()

    Write-Host "`n[4/4] Results:" -ForegroundColor Yellow
    Write-Host "      Total events: $eventCount" -ForegroundColor $(if ($eventCount -gt 0) { "Green" } else { "Red" })
    Write-Host "      Delta events: $deltaCount" -ForegroundColor $(if ($deltaCount -gt 0) { "Green" } else { "Red" })
    Write-Host "      [DONE] received: $doneReceived" -ForegroundColor $(if ($doneReceived) { "Green" } else { "Red" })
    Write-Host "      Content length: $($content.Length) chars" -ForegroundColor Gray

    if ($content.Length -gt 0) {
        Write-Host "`n      Preview: $($content.Substring(0, [Math]::Min(100, $content.Length)))..." -ForegroundColor Cyan
    }

    Write-Host "`n=== Test Complete ===" -ForegroundColor $(if ($doneReceived -and $deltaCount -gt 0) { "Green" } else { "Yellow" })

    if (-not $doneReceived) {
        Write-Host "[WARNING] [DONE] marker not received - stream may have been interrupted" -ForegroundColor Yellow
    }

} catch {
    Write-Host "`n[ERROR] Test failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host $_.Exception.StackTrace -ForegroundColor DarkRed
    exit 1
}
