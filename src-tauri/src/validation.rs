use serde_json::Value;
use std::collections::{HashMap, HashSet};
pub type Result<T> = std::result::Result<T, String>;
pub const COLLECTIONS: [&str; 5] = ["topics", "tasks", "activities", "sources", "attachments"];
pub fn string<'a>(v: &'a Value, key: &str) -> Result<&'a str> {
    v.get(key)
        .and_then(Value::as_str)
        .filter(|s| {
            s.len()
                <= match key {
                    "title" | "subject" | "owner" | "platform" | "originalName"
                    | "name" | "email" | "jobTitle" | "area" | "requesterName" => 500,
                    "category" | "mime" | "id" | "topicId" | "parentId" | "orderParentId" | "recurrenceRootId" => 200,
                    "identifier" => 1000,
                    "url" => 4096,
                    _ => 100_000,
                }
        })
        .ok_or_else(|| format!("Invalid {key}"))
}
pub fn list<'a>(v: &'a Value, key: &str) -> Result<&'a Vec<Value>> {
    v.get(key)
        .and_then(Value::as_array)
        .ok_or_else(|| format!("Invalid {key}"))
}
fn choices(v: &Value, key: &str, values: &[&str]) -> Result<()> {
    if !values.contains(&string(v, key)?) {
        return Err(format!("Invalid {key}"));
    }
    Ok(())
}
fn timestamp(s: &str) -> Result<()> {
    chrono::DateTime::parse_from_rfc3339(s)
        .map(|_| ())
        .map_err(|_| "Invalid timestamp".into())
}
fn optional_date(v: &Value, key: &str, datetime: bool) -> Result<()> {
    if v.get(key) == Some(&Value::Null) {
        return Ok(());
    }
    let s = string(v, key)?;
    if datetime {
        timestamp(s)
    } else {
        chrono::NaiveDate::parse_from_str(s, "%Y-%m-%d")
            .map(|_| ())
            .map_err(|_| format!("Invalid {key}"))
    }
}
pub fn managed_name(s: &str) -> Result<()> {
    if s.len() > 100 || s.contains(['/', '\\', ':']) || s.starts_with('.') {
        return Err("Unsafe managed filename".into());
    }
    let stem = s.split('.').next().unwrap_or("");
    uuid::Uuid::parse_str(stem).map_err(|_| "Invalid attachment filename".to_string())?;
    Ok(())
}
pub fn validate(w: &Value) -> Result<()> {
    if w["formatVersion"] != 1 || w["revision"].as_u64().is_none() {
        return Err("Incompatible workspace format".into());
    }
    let expected = 7
        + usize::from(w.get("responsibleNames").is_some())
        + usize::from(w.get("contacts").is_some())
        + usize::from(w.get("categoryColors").is_some());
    if w.as_object().map(|v| v.len()) != Some(expected) {
        return Err("Unexpected workspace fields".into());
    }
    if let Some(names) = w.get("responsibleNames") {
        validate_names(names)?;
    }
    if w.get("contacts").is_some() {
        let contacts = list(w, "contacts")?;
        if contacts.len() > 10_000 {
            return Err("Too many contacts".into());
        }
        let mut names = HashSet::new();
        for contact in contacts {
            let fields = ["name", "email", "jobTitle", "area"];
            let object = contact.as_object().ok_or("Invalid contact")?;
            if object.len() != fields.len() || object.keys().any(|key| !fields.contains(&key.as_str())) {
                return Err("Unexpected or missing contact fields".into());
            }
            for field in fields {
                string(contact, field)?;
            }
            let name = string(contact, "name")?.trim();
            if name.is_empty() || !names.insert(name.to_lowercase()) {
                return Err("Invalid or duplicate contact name".into());
            }
        }
    }
    if let Some(colors) = w.get("categoryColors") {
        let colors = colors.as_object().ok_or("Invalid category colors")?;
        for (name, color) in colors {
            let color = color.as_str().ok_or("Invalid category color")?;
            if name.trim().is_empty()
                || name.len() > 200
                || color.len() != 7
                || !color.starts_with('#')
                || !color[1..].bytes().all(|c| c.is_ascii_hexdigit())
            {
                return Err("Invalid category color".into());
            }
        }
    }
    let mut managed_files = HashSet::new();
    let mut ids: HashMap<&str, HashSet<&str>> = HashMap::new();
    for kind in COLLECTIONS {
        let entities = list(w, kind)?;
        if entities.len() > 100_000 {
            return Err("Too many records".into());
        }
        let mut set = HashSet::new();
        for e in entities {
            let allowed = match kind {
                "topics" => "id createdAt updatedAt title summary category status priority owner participants tags nextAction targetDate closedAt archived relatedTopicIds",
                "tasks" => "id createdAt updatedAt title description topicId parentId status priority owner startDate dueDate completedAt nextAction tags sourceIds recurrence recurrenceRootId occurrenceDate",
                "activities" => "id createdAt updatedAt text kind eventAt topicIds taskIds sourceIds revisions",
                "sources" => "id createdAt updatedAt title kind platform identifier url eventAt participants notes tags topicIds",
                "attachments" => "id originalName managedName mime size addedAt topicIds taskIds activityIds sourceIds", _ => ""
            };
            let mut fields: HashSet<_> = allowed.split(' ').collect();
            if kind == "tasks" {
                for key in ["reminderAt", "reminderDismissedAt"] {
                    if e.get(key).is_some() {
                        fields.insert(key);
                        optional_date(e, key, true)?;
                    }
                }
                if e.get("reminderDismissedAt").is_some_and(|value| !value.is_null())
                    && e.get("reminderAt").is_none_or(|value| value.is_null()) {
                    return Err("A dismissed reminder requires a scheduled time".into());
                }
            }
            if kind == "topics" && e.get("requesterName").is_some() {
                fields.insert("requesterName");
                string(e, "requesterName")?;
            }
            if kind == "topics" && e.get("startDate").is_some() {
                fields.insert("startDate");
                optional_date(e, "startDate", false)?;
            }
            if kind == "tasks" && e.get("order").is_some() {
                fields.insert("order");
                if e["order"].as_u64().is_none_or(|value| value > 9_007_199_254_740_991) {
                    return Err("Invalid task order".into());
                }
            }
            if kind == "tasks" && e.get("orderParentId").is_some() {
                fields.insert("orderParentId");
                if !e["orderParentId"].is_null() {
                    string(e, "orderParentId")?;
                }
            }
            if kind == "tasks" && e.get("blockReason").is_some() {
                fields.insert("blockReason");
                let reason = string(e, "blockReason")?;
                if reason.chars().count() > 10_000
                    || (e["status"] == "blocked" && reason.trim().is_empty())
                {
                    return Err("A valid reason is required for blocked tasks".into());
                }
            }
            if ["tasks", "topics"].contains(&kind) && e.get("responsibleNames").is_some() {
                fields.insert("responsibleNames");
                validate_names(&e["responsibleNames"])?;
            }
            if kind == "sources" {
                if e.get("subject").is_some() {
                    fields.insert("subject");
                    string(e, "subject")?;
                }
                if e.get("messageContext").is_some() {
                    fields.insert("messageContext");
                    choices(e, "messageContext", &["sender", "participants", "group"])?;
                }
            }
            let obj = e.as_object().ok_or("Invalid record")?;
            if obj.len() != fields.len() || obj.keys().any(|k| !fields.contains(k.as_str())) {
                return Err("Unexpected or missing record fields".into());
            }
            let id = string(e, "id")?;
            if id.is_empty() {
                return Err("Invalid record ID".into());
            }
            if !set.insert(id) {
                return Err("Duplicate record ID".into());
            }
            if kind != "attachments" {
                timestamp(string(e, "createdAt")?)?;
                timestamp(string(e, "updatedAt")?)?;
            }
            if ["topics", "tasks", "sources"].contains(&kind) {
                if string(e, "title")?.trim().is_empty() {
                    return Err("Title is required".into());
                }
            }
            if ["topics", "tasks"].contains(&kind) {
                choices(
                    e,
                    "status",
                    &["pending", "in_progress", "blocked", "completed", "canceled"],
                )?;
                choices(e, "priority", &["low", "normal", "high", "urgent"])?;
                for k in ["owner", "nextAction"] {
                    string(e, k)?;
                }
            }
            if ["topics", "tasks", "sources"].contains(&kind) {
                if list(e, "tags")?.len() > 100 {
                    return Err("Too many tags".into());
                }
                for tag in list(e, "tags")? {
                    if !tag
                        .as_str()
                        .is_some_and(|s| !s.trim().is_empty() && s.len() <= 100)
                    {
                        return Err("Invalid tag".into());
                    }
                }
            }
            match kind {
                "topics" => {
                    for k in ["summary", "category", "participants"] {
                        string(e, k)?;
                    }
                    optional_date(e, "targetDate", false)?;
                    optional_date(e, "closedAt", true)?;
                    if !e["archived"].is_boolean() {
                        return Err("Invalid archive state".into());
                    }
                }
                "tasks" => {
                    string(e, "description")?;
                    choices(e, "recurrence", &["none", "daily", "weekly", "monthly"])?;
                    for k in ["startDate", "dueDate", "occurrenceDate"] {
                        optional_date(e, k, false)?;
                    }
                    optional_date(e, "completedAt", true)?;
                }
                "activities" => {
                    if string(e, "text")?.trim().is_empty() {
                        return Err("Activity text is required".into());
                    }
                    timestamp(string(e, "eventAt")?)?;
                    choices(
                        e,
                        "kind",
                        &[
                            "note",
                            "progress",
                            "decision",
                            "blocker",
                            "meeting",
                            "outcome",
                            "status",
                            "milestone",
                        ],
                    )?;
                    for r in list(e, "revisions")? {
                        if r.as_object().map(|v| v.len()) != Some(2) {
                            return Err("Invalid revision".into());
                        }
                        string(r, "text")?;
                        timestamp(string(r, "revisedAt")?)?;
                    }
                }
                "sources" => {
                    choices(
                        e,
                        "kind",
                        &[
                            "mail",
                            "ticketing",
                            "messaging",
                            "email",
                            "teams",
                            "invgate",
                            "document",
                            "meeting",
                            "url",
                            "phone",
                            "system",
                            "other",
                        ],
                    )?;
                    for k in ["platform", "identifier", "url", "participants", "notes"] {
                        string(e, k)?;
                    }
                    timestamp(string(e, "eventAt")?)?;
                    let u = string(e, "url")?;
                    if !u.is_empty() {
                        validate_url(u)?;
                    }
                }
                "attachments" => {
                    managed_name(string(e, "managedName")?)?;
                    if !managed_files.insert(string(e, "managedName")?) {
                        return Err("Duplicate managed filename".into());
                    }
                    if string(e, "originalName")?.is_empty() {
                        return Err("Missing original filename".into());
                    }
                    string(e, "mime")?;
                    timestamp(string(e, "addedAt")?)?;
                    if e["size"]
                        .as_u64()
                        .filter(|n| *n <= 100 * 1024 * 1024)
                        .is_none()
                    {
                        return Err("File exceeds 100 MiB".into());
                    }
                }
                _ => {}
            }
        }
        ids.insert(kind, set);
    }
    for kind in COLLECTIONS {
        for e in list(w, kind)? {
            for (field, target) in relations(kind) {
                let links = list(e, field)?;
                let unique: HashSet<_> = links.iter().filter_map(Value::as_str).collect();
                if links.len() > 10000 || unique.len() != links.len() {
                    return Err("Invalid or duplicate relationships".into());
                }
                for id in links {
                    if !id.as_str().is_some_and(|s| ids[*target].contains(s)) {
                        return Err(format!("Missing relationship: {field}"));
                    }
                }
            }
            if kind == "topics" && list(e, "relatedTopicIds")?.iter().any(|id| id == &e["id"]) {
                return Err("A topic cannot relate to itself".into());
            }
            if kind == "tasks" {
                if let (Some(start), Some(due)) = (e["startDate"].as_str(), e["dueDate"].as_str()) {
                    if start > due {
                        return Err("Task start exceeds due date".into());
                    }
                }
                if e["recurrence"] != "none" && e["dueDate"].is_null() {
                    return Err("Recurring tasks require a due date".into());
                }
                if e["recurrenceRootId"].is_null() && !e["occurrenceDate"].is_null() {
                    return Err("Occurrence requires recurrence root".into());
                }
                if !e["recurrenceRootId"].is_null() {
                    let root = list(w, "tasks")?
                        .iter()
                        .find(|t| t["id"] == e["recurrenceRootId"])
                        .ok_or("Missing recurrence root")?;
                    if !root["recurrenceRootId"].is_null()
                        || root["id"] == e["id"]
                        || root["recurrence"] == "none"
                        || e["occurrenceDate"].is_null()
                    {
                        return Err("Invalid recurrence root or occurrence".into());
                    }
                }
                if !ids["topics"].contains(string(e, "topicId")?) {
                    return Err("Missing task topic".into());
                }
                for field in ["parentId", "recurrenceRootId"] {
                    if e.get(field) != Some(&Value::Null)
                        && !ids["tasks"].contains(string(e, field)?)
                    {
                        return Err(format!("Missing {field}"));
                    }
                }
                let mut seen = HashSet::new();
                let mut current = e;
                while current["parentId"] != Value::Null {
                    let id = string(current, "id")?;
                    if !seen.insert(id) {
                        return Err("Subtask cycle".into());
                    }
                    current = list(w, "tasks")?
                        .iter()
                        .find(|t| t["id"] == current["parentId"])
                        .ok_or("Missing parent")?;
                    if current["topicId"] != e["topicId"] {
                        return Err("Subtasks must share their parent topic".into());
                    }
                }
            }
        }
    }
    let mut occurrences = HashSet::new();
    for t in list(w, "tasks")? {
        if !t["recurrenceRootId"].is_null()
            && !t["occurrenceDate"].is_null()
            && !occurrences.insert((
                t["recurrenceRootId"].to_string(),
                t["occurrenceDate"].to_string(),
            ))
        {
            return Err("Duplicate recurring occurrence".into());
        }
    }
    Ok(())
}
pub fn relations(kind: &str) -> &'static [(&'static str, &'static str)] {
    match kind {
        "topics" => &[("relatedTopicIds", "topics")],
        "tasks" => &[("sourceIds", "sources")],
        "activities" => &[
            ("topicIds", "topics"),
            ("taskIds", "tasks"),
            ("sourceIds", "sources"),
        ],
        "sources" => &[("topicIds", "topics")],
        "attachments" => &[
            ("topicIds", "topics"),
            ("taskIds", "tasks"),
            ("activityIds", "activities"),
            ("sourceIds", "sources"),
        ],
        _ => &[],
    }
}
pub fn validate_url(s: &str) -> Result<()> {
    let u = url::Url::parse(s).map_err(|_| "Invalid reference URL")?;
    if !["https", "http", "msteams"].contains(&u.scheme())
        || u.host_str().is_none()
        || !u.username().is_empty()
        || u.password().is_some()
        || s.chars().any(char::is_control)
    {
        return Err("Only HTTP, HTTPS or Teams references are allowed".into());
    }
    Ok(())
}

fn validate_names(value: &Value) -> Result<()> {
    let names = value.as_array().ok_or("Invalid responsibles")?;
    if names.len() > 10000 {
        return Err("Too many responsibles".into());
    }
    let mut unique = HashSet::new();
    for name in names {
        let name = name.as_str().ok_or("Invalid responsible name")?;
        if name.trim().is_empty() || name.len() > 500 || !unique.insert(name.to_lowercase()) {
            return Err("Invalid or duplicate responsible name".into());
        }
    }
    Ok(())
}
