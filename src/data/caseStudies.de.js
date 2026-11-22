const cards = {
  'ai-invoice-processing-automation': {
    title: 'Rechnungsdaten mit n8n extrahieren und prüfen',
    summary: 'Ein n8n-Workflow liest Rechnungsköpfe und Positionen aus, übersetzt Beschreibungen, prüft Summen und übergibt die Daten zur Kontrolle in Google Sheets und zur Weiterverarbeitung in Excel.',
    caption: 'Schematische Darstellung des Workflows.',
    alt: 'n8n-Workflow vom Rechnungseingang über Extraktion, Übersetzung und Prüfung bis zur manuellen Kontrolle und Tabellenausgabe.',
  },
  'ai-project-planning-assistant': {
    title: 'Assistent für die Projektplanung mit LangGraph',
    summary: 'Ein LangGraph-Assistent klärt die Projektanforderungen, recherchiert Teilaufgaben und erstellt einen Umsetzungsplan in Markdown zur technischen Prüfung.',
    caption: 'Schematische Darstellung des Konzepts.',
    alt: 'Ablauf der KI-gestützten Projektplanung vom Ziel über Teilaufgaben und Abhängigkeiten bis zum Maßnahmenplan.',
  },
  'browser-search-to-spreadsheet': {
    title: 'Browsersuchen aus einer Tabelle automatisieren',
    summary: 'Eine Tabelle steuert Browsersuchen und nimmt Ergebnis-URLs, Zeitstempel und den Status je Zeile auf. So lässt sich jeder Suchlauf überprüfen.',
    caption: 'Schematische Darstellung mit fiktiven Suchdaten.',
    alt: 'Tabellenzeilen lösen Browsersuchen aus. Ergebnis-URLs, Zeitstempel und Ausführungsstatus werden in die Tabelle zurückgeschrieben.',
  },
  'depth-based-distance-estimation': {
    title: 'Abstände per Webcam mit Depth Anything V2 schätzen',
    summary: 'Ein Python-Prototyp kombiniert Objekterkennung und Tiefenschätzung, um ungefähre Abstände zwischen erkannten Objekten im Webcam-Bild anzuzeigen.',
    caption: 'Webcam-Beispiel. Gespeicherter Referenzmaßstab und angenommene Kamerageometrie müssen für den jeweiligen Aufbau geprüft werden.',
    alt: 'RT-DETR und Depth Anything V2 erzeugen eine Abstandsanzeige im Webcam-Bild. Maßstab und Kamerageometrie müssen am jeweiligen Aufbau geprüft werden.',
  },
  'healthcare-document-intelligence': {
    title: 'Farbcodierte PDF-Dienstpläne nach Excel übertragen',
    summary: 'Ein Python-Programm überträgt Dienstpläne aus PDF-Tabellen in Excel. Datum, Schicht und farbcodierte Dienstwünsche bleiben zur Prüfung durch die Koordination erhalten.',
    caption: 'Beispiel mit nativem PDF und fiktiven Einträgen. Legende für Dienstwünsche: 0 frei, 1 verfügbar, 2 Dienst gewünscht.',
    alt: 'Übertragung eines nativen PDF-Dienstplans in Excel mit fiktiven Einträgen: 0 frei, 1 verfügbar, 2 Dienst gewünscht.',
  },
  'invoice-ocr-extraction': {
    title: 'Rechnungsfotos per Python-OCR nach Excel übertragen',
    summary: 'Ein lokales Python-Programm liest Namen, Adressen und Steuer-IDs aus Rechnungsfotos mit bekanntem Layout aus. Jede Excel-Zeile enthält den ursprünglichen Dateinamen.',
    caption: 'Schematische Darstellung für ein bekanntes Layout mit festem Bildausschnitt.',
    alt: 'Daten aus einem festen Bildausschnitt werden per OCR in Excel-Zeilen mit Quelldateinamen übertragen.',
  },
  'n8n-openai-data-extraction': {
    title: 'Webdaten mit n8n extrahieren und als JSON ausgeben',
    summary: 'Ein Workflow mit n8n und OpenAI findet Datensätze auf Websites, verarbeitet Excel-, CSV- und HTML-Tabellen und erstellt strukturiertes JSON mit Schemata und Tags.',
    caption: 'Schematische Darstellung des Workflows.',
    alt: 'Verarbeitung von Excel-, CSV- und HTML-Datensätzen zu strukturiertem JSON, gruppiert nach Start-URL.',
  },
  'n8n-python-ai-agents': {
    title: 'Datensätze mit n8n synchronisieren und PostgreSQL abfragen',
    summary: 'n8n-Workflows trennen das Anlegen, Aktualisieren und Löschen von Datensätzen. Ein separater Chat-Assistent berücksichtigt das PostgreSQL-Schema bei Abfragen.',
    caption: 'Schematischer Ablauf. SELECT-Prüfungen und LIMIT 100 als Standard garantieren weder reinen Lesezugriff noch eine maximale Ergebnisgröße.',
    alt: 'Datensatzsynchronisierung und separater SQL-Abfrageassistent. SELECT-Prüfungen und LIMIT 100 als Standard garantieren weder reinen Lesezugriff noch eine maximale Ergebnisgröße.',
  },
  'python-ci-workflow-automation': {
    title: 'Aufgaben zur Codequalität mit Python automatisieren',
    summary: 'Ein Python-Werkzeug bündelt Linting, KI-gestützte Review-Entwürfe und Repository-Hilfen in wiederverwendbaren Befehlen mit testbarer Ablauflogik.',
    caption: 'Schematische Darstellung zur Unterstützung eines bestehenden Codequalitätsprozesses. Sie zeigt keinen ausgeführten CI-Lauf.',
    alt: 'Python-Workflow mit wiederverwendbaren Befehlen für Linting, KI-gestützte Review-Texte und Hilfen für Pull Requests.',
  },
  'resumable-listing-data-extraction': {
    title: 'Angebotsdaten mit Python und Wiederaufnahme nach CSV exportieren',
    summary: 'Ein Python-Programm speichert Ergebnisse fortlaufend in CSV und JSON Lines. Nach einer Unterbrechung setzt es die Verarbeitung anhand bereits erfasster Angebots-IDs fort.',
    caption: 'Schematische Darstellung. Die Wiederaufnahme nutzt gespeicherte Angebots-IDs aus JSON Lines. Die Verarbeitungseinstellungen stehen im Code.',
    alt: 'Angebotsdaten werden fortlaufend in CSV und JSON Lines gespeichert. Beim Neustart werden die bereits erfassten IDs aus JSON Lines gelesen. Die Verarbeitungseinstellungen stehen im Code.',
  },
  'sports-video-analytics-yolo': {
    title: 'Fußballspieler mit YOLO und Trikotfarben verfolgen',
    summary: 'Eine Python-Pipeline kombiniert YOLO-Erkennung, Zuordnung anhand der Trikotfarben und ByteTrack-IDs. Das Ergebnis ist annotiertes Spielmaterial für die visuelle Analyse.',
    caption: 'Schematische Darstellung des Workflows.',
    alt: 'Fußballvideo mit YOLO-Erkennung, Teamzuordnung anhand des Erscheinungsbilds und Tracking-IDs.',
  },
  'yolo-computer-vision-optimization': {
    title: 'Posen auf Fitnessbildern mit YOLO schätzen',
    summary: 'Ein Python-Projekt für Training und Inferenz markiert Personen und Körperpunkte in Trainingsbildern für die Sichtprüfung und Entwicklung von Fitnessprodukten.',
    caption: 'Beispiel mit einem Standbild. Die Bewertung der Bewegungsausführung erfolgt separat.',
    alt: 'YOLO-Posenschätzung mit Personenrahmen und markierten Körperpunkten auf einem Standbild.',
  },
};

const categories = {
  'Data Extraction': 'Datenextraktion',
  'Document AI': 'Dokumenten-KI',
  'AI Agents': 'KI-Agenten',
  'Browser Automation': 'Browserautomatisierung',
  'AI Workflow Automation': 'KI-Workflow-Automatisierung',
  'Developer Automation': 'Entwicklungsautomatisierung',
};

export const germanCardCopy = (story) => ({
  ...cards[story.slug],
  category: categories[story.category] ?? story.category,
});
