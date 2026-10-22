use crate::{archive, storage::Store, validation};
use serde_json::{json, Value};
fn empty() -> Value {
    json!({"formatVersion":1,"revision":0,"topics":[],"tasks":[],"activities":[],"sources":[],"attachments":[]})
}
fn topic() -> Value {
    json!({"id":"00000000-0000-4000-8000-000000000001","createdAt":"2026-01-01T12:00:00Z","updatedAt":"2026-01-01T12:00:00Z","title":"Fixture","summary":"","category":"incident","status":"pending","priority":"normal","owner":"","participants":"","tags":[],"nextAction":"","targetDate":null,"closedAt":null,"archived":false,"relatedTopicIds":[]})
}
#[test]
fn attachment_access_regression_missing_files_and_replaced_versions() {
    use sha2::{Digest, Sha256};
    let dir = tempfile::tempdir().unwrap();
    let mut db = Store::open(dir.path().into()).unwrap();
    let id = "00000000-0000-4000-8000-000000000002";
    let name = format!("{id}.csv");
    let missing = "00000000-0000-4000-8000-000000000003.txt";
    let root = dir.path().join("attachments");
    let original = b"a\n1\n";
    std::fs::write(root.join(&name), original).unwrap();
    std::fs::write(root.join(missing), b"old").unwrap();
    let mut w = empty();
    w["topics"] = json!([topic()]);
    w["attachments"] = json!([
        {"id":id,"originalName":"fixture.csv","managedName":name,"mime":"text/csv","size":4,"addedAt":"2026-01-01T12:00:00Z","topicIds":[topic()["id"]],"taskIds":[],"activityIds":[],"sourceIds":[]},
        {"id":"missing","originalName":"old.txt","managedName":missing,"mime":"text/plain","size":3,"addedAt":"2026-01-01T12:00:00Z","topicIds":[],"taskIds":[],"activityIds":[],"sourceIds":[]}
    ]);
    let mut w = db.save(w).unwrap();
    std::fs::remove_file(root.join(missing)).unwrap();
    let mut second = topic();
    second["id"] = json!("another-topic");
    w["topics"].as_array_mut().unwrap().push(second);
    let saved = db.save(w).expect("a missing old attachment must not block a new topic");
    assert_eq!(saved["topics"].as_array().unwrap().len(), 2);
    let statuses = crate::attachment_access::statuses(&db, Some("missing")).unwrap();
    assert!(matches!(statuses["missing"], crate::attachment_access::AttachmentStatus::Missing));

    let version = format!("{:x}", Sha256::digest(original));
    let edited = b"a\n2\n"; // Same byte count, different contents.
    let saved = crate::document_files::save(&mut db, id, &version, edited).unwrap();
    assert!(saved.cleanup_warning.is_none());
    let file = saved.workspace["attachments"].as_array().unwrap().iter().find(|file| file["id"] == id).unwrap();
    let next_name = file["managedName"].as_str().unwrap().to_owned();
    assert_eq!(file["topicIds"], json!([topic()["id"]]));
    assert!(!root.join(&name).exists());
    assert_eq!(std::fs::read(root.join(&next_name)).unwrap(), edited);
    assert_eq!(std::fs::read_dir(&root).unwrap().count(), 1);

    assert!(crate::document_files::save(&mut db, id, &version, b"a\n3\n").is_err());
    let next_version = format!("{:x}", Sha256::digest(edited));
    crate::document_files::save(&mut db, id, &next_version, edited).unwrap();
    assert_eq!(std::fs::read_dir(&root).unwrap().count(), 1);
    assert!(crate::document_files::save(&mut db, id, &next_version, b"\0").is_err());
    assert_eq!(std::fs::read(root.join(next_name)).unwrap(), edited);
    assert_eq!(std::fs::read_dir(root).unwrap().count(), 1);
}
#[test]
fn migration_crud_reopen_and_optimistic_conflict() {
    let dir = tempfile::tempdir().unwrap();
    let mut db = Store::open(dir.path().into()).unwrap();
    let mut w = empty();
    w["topics"] = json!([topic()]);
    let saved = db.save(w.clone()).unwrap();
    assert_eq!(saved["revision"], 1);
    assert!(db.save(w).unwrap_err().contains("another window"));
    drop(db);
    let mut db = Store::open(dir.path().into()).unwrap();
    assert_eq!(db.load().unwrap(), saved);
    let mut update = saved;
    update["topics"][0]["summary"] = json!("Updated");
    let saved = db.save(update).unwrap();
    assert_eq!(saved["topics"][0]["summary"], "Updated");
    let mut delete = saved;
    delete["topics"] = json!([]);
    assert_eq!(db.save(delete).unwrap()["topics"], json!([]));
}
#[test]
fn invalid_relationships_rollback_and_database_enforces_foreign_keys() {
    let dir = tempfile::tempdir().unwrap();
    let mut db = Store::open(dir.path().into()).unwrap();
    let mut w = empty();
    let mut t = topic();
    t["relatedTopicIds"] = json!(["00000000-0000-4000-8000-000000000099"]);
    w["topics"] = json!([t]);
    assert!(db.save(w).is_err());
    assert_eq!(db.load().unwrap(), empty());
    assert!(db
        .db
        .execute(
            "INSERT INTO topics_relatedTopicIds VALUES('missing','missing')",
            []
        )
        .is_err());
}
#[test]
fn portable_backup_restore_keeps_prior_state_backup_and_files() {
    let dir = tempfile::tempdir().unwrap();
    let mut db = Store::open(dir.path().into()).unwrap();
    let mut w = empty();
    w["topics"] = json!([topic()]);
    let name = "00000000-0000-4000-8000-000000000002.txt";
    std::fs::write(dir.path().join("attachments").join(name), "fixture").unwrap();
    w["attachments"] = json!([{"id":"00000000-0000-4000-8000-000000000002","originalName":"fixture.txt","managedName":name,"mime":"text/plain","size":7,"addedAt":"2026-01-01T12:00:00Z","topicIds":[topic()["id"]],"taskIds":[],"activityIds":[],"sourceIds":[]}]);
    let saved = db.save(w).unwrap();
    let zip = archive::backup(&db).unwrap();
    let mut updated = saved;
    updated["topics"][0]["title"] = json!("Before restore");
    db.save(updated).unwrap();
    let staged = archive::inspect(&zip, dir.path()).unwrap();
    assert!(!staged.token.is_empty());
    let result = archive::restore(&mut db, staged).unwrap();
    assert_eq!(result["topics"][0]["title"], "Fixture");
    assert_ne!(result["attachments"][0]["managedName"], name);
    assert!(dir.path().join("attachments").join(name).exists());
    assert_eq!(
        std::fs::read_dir(dir.path().join("backups"))
            .unwrap()
            .count(),
        2
    );
}
#[test]
fn rejects_corrupt_archives_unsafe_names_and_executable_content() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("bad.zip");
    std::fs::write(&path, "not a ZIP").unwrap();
    assert!(archive::inspect(&path, dir.path()).is_err());
    for name in ["../bad.txt", "C:\\bad.txt", ".hidden", "not-uuid.txt"] {
        assert!(validation::managed_name(name).is_err());
    }
    let path = dir.path().join("renamed.pdf");
    std::fs::write(&path, b"MZ\0\0executable").unwrap();
    assert!(crate::storage::safe_document(&path).is_err());
}
#[test]
fn rejects_zip_traversal_and_missing_attachments_without_mutation() {
    use std::io::Write;
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("bad.zip");
    let file = std::fs::File::create(&path).unwrap();
    let mut zip = zip::ZipWriter::new(file);
    zip.start_file("../escape", zip::write::SimpleFileOptions::default())
        .unwrap();
    zip.write_all(b"bad").unwrap();
    zip.finish().unwrap();
    assert!(archive::inspect(&path, dir.path()).is_err());
    assert!(!dir.path().join("escape").exists());
}
#[test]
fn only_explicit_reference_protocols_are_openable() {
    for good in [
        "https://example.com/path",
        "http://example.com",
        "msteams://teams.microsoft.com/l/message/1",
    ] {
        assert!(validation::validate_url(good).is_ok());
    }
    for bad in [
        "file:///etc/passwd",
        "javascript:alert(1)",
        "https://user:password@example.com",
        "https://example.com\n",
    ] {
        assert!(validation::validate_url(bad).is_err());
    }
}
#[test]
fn linked_entities_roundtrip_and_recurrence_constraint() {
    let dir = tempfile::tempdir().unwrap();
    let mut db = Store::open(dir.path().into()).unwrap();
    let mut w = empty();
    w["topics"] = json!([topic()]);
    let source = json!({"id":"source-a","title":"Reference","kind":"email","platform":"Manual","identifier":"REF-1","url":"","eventAt":"2026-01-01T10:00:00Z","participants":"","notes":"","tags":[],"topicIds":[topic()["id"]],"createdAt":"2026-01-02T12:00:00Z","updatedAt":"2026-01-02T12:00:00Z"});
    let task = json!({"id":"task-a","title":"Action","description":"","topicId":topic()["id"],"parentId":null,"status":"pending","priority":"normal","owner":"","startDate":null,"dueDate":"2026-01-31","completedAt":null,"nextAction":"","tags":[],"sourceIds":["source-a"],"recurrence":"monthly","recurrenceRootId":null,"occurrenceDate":null,"createdAt":"2026-01-02T12:00:00Z","updatedAt":"2026-01-02T12:00:00Z"});
    w["sources"] = json!([source]);
    w["tasks"] = json!([task.clone()]);
    w["activities"] = json!([{"id":"activity-a","text":"Recorded later than the event","kind":"decision","eventAt":"2026-01-01T10:00:00Z","createdAt":"2026-01-02T12:00:00Z","updatedAt":"2026-01-02T12:00:00Z","topicIds":[topic()["id"]],"taskIds":["task-a"],"sourceIds":["source-a"],"revisions":[]}]);
    let saved = db.save(w).unwrap();
    assert_eq!(saved, db.load().unwrap());
    assert_eq!(saved["activities"][0]["eventAt"], "2026-01-01T10:00:00Z");
    let mut invalid = saved.clone();
    invalid["tasks"][0]["parentId"] = json!("task-a");
    assert!(db.save(invalid).is_err());
    assert_eq!(db.load().unwrap(), saved);
    let mut occurrence = task;
    occurrence["id"] = json!("task-b");
    occurrence["recurrence"] = json!("none");
    occurrence["recurrenceRootId"] = json!("task-a");
    occurrence["occurrenceDate"] = json!("2026-02-28");
    let mut updated = saved;
    updated["tasks"]
        .as_array_mut()
        .unwrap()
        .push(occurrence.clone());
    let saved = db.save(updated).unwrap();
    occurrence["id"] = json!("task-c");
    let mut invalid = saved.clone();
    invalid["tasks"].as_array_mut().unwrap().push(occurrence);
    assert!(db.save(invalid).is_err());
    assert_eq!(db.load().unwrap(), saved);
}
#[test]
fn rejects_manifest_incompatible_and_missing_file_archives() {
    use std::io::Write;
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("fixture.zip");
    let mut w = empty();
    w["formatVersion"] = json!(2);
    let write = |w: &Value| {
        let file = std::fs::File::create(&path).unwrap();
        let mut zip = zip::ZipWriter::new(file);
        zip.start_file("workspace.json", zip::write::SimpleFileOptions::default())
            .unwrap();
        zip.write_all(serde_json::to_string(w).unwrap().as_bytes())
            .unwrap();
        zip.finish().unwrap();
    };
    write(&w);
    assert!(archive::inspect(&path, dir.path()).is_err());
    w = empty();
    w["attachments"] = json!([{"id":"file-a","originalName":"missing.txt","managedName":"00000000-0000-4000-8000-000000000002.txt","mime":"text/plain","size":7,"addedAt":"2026-01-01T12:00:00Z","topicIds":[],"taskIds":[],"activityIds":[],"sourceIds":[]}]);
    write(&w);
    assert!(archive::inspect(&path, dir.path()).is_err());
}
#[test]
fn failed_storage_initialization_can_be_retried_without_restart() {
    let dir = tempfile::tempdir().unwrap();
    let root = dir.path().join("data");
    // A file blocking the application directory reproduces an initialization error
    // without depending on host permissions or elevated test execution.
    std::fs::write(&root, "blocked directory").unwrap();
    let access = crate::storage::StoreAccess::new(root.clone());
    let error = access.with(|store| store.load()).unwrap_err();
    assert!(error.contains("Check directory permissions"));
    std::fs::remove_file(&root).unwrap();
    let mut workspace = empty();
    workspace["topics"] = json!([topic()]);
    let saved = access.with(|store| store.save(workspace)).unwrap();
    assert_eq!(access.with(|store| store.load()).unwrap(), saved);
}

#[test]
fn deleted_tasks_history_and_relationships_stay_deleted_after_reopen_and_export() {
    let dir = tempfile::tempdir().unwrap();
    let mut db = Store::open(dir.path().into()).unwrap();
    let mut w = empty();
    w["topics"] = json!([topic()]);
    let task = json!({"id":"test-task","title":"Discard test task","description":"","topicId":topic()["id"],"parentId":null,"status":"pending","priority":"normal","owner":"","startDate":null,"dueDate":null,"completedAt":null,"nextAction":"","tags":[],"sourceIds":[],"recurrence":"none","recurrenceRootId":null,"occurrenceDate":null,"createdAt":"2026-01-02T12:00:00Z","updatedAt":"2026-01-02T12:00:00Z"});
    w["tasks"] = json!([task]);
    w["activities"] = json!([{"id":"test-history","text":"Discard test history","kind":"status","eventAt":"2026-01-02T12:00:00Z","createdAt":"2026-01-02T12:00:00Z","updatedAt":"2026-01-02T12:00:00Z","topicIds":[topic()["id"]],"taskIds":["test-task"],"sourceIds":[],"revisions":[{"text":"Discard old revision","revisedAt":"2026-01-02T12:00:00Z"}]}]);
    let name = "00000000-0000-4000-8000-000000000002.txt";
    std::fs::write(dir.path().join("attachments").join(name), "fixture").unwrap();
    w["attachments"] = json!([{"id":"file","originalName":"fixture.txt","managedName":name,"mime":"text/plain","size":7,"addedAt":"2026-01-01T12:00:00Z","topicIds":[topic()["id"]],"taskIds":["test-task"],"activityIds":["test-history"],"sourceIds":[]}]);
    let mut deleted = db.save(w).unwrap();
    deleted["tasks"] = json!([]);
    deleted["activities"] = json!([]);
    deleted["attachments"][0]["taskIds"] = json!([]);
    deleted["attachments"][0]["activityIds"] = json!([]);
    db.save(deleted).unwrap();
    drop(db);
    let db = Store::open(dir.path().into()).unwrap();
    let loaded = db.load().unwrap();
    assert_eq!(loaded["tasks"], json!([]));
    assert_eq!(loaded["activities"], json!([]));
    assert!(!loaded.to_string().contains("Discard"));
    for table in [
        "activities_taskIds",
        "attachments_taskIds",
        "attachments_activityIds",
    ] {
        let count: i64 = db
            .db
            .query_row(&format!("SELECT count(*) FROM {table}"), [], |row| {
                row.get(0)
            })
            .unwrap();
        assert_eq!(count, 0);
    }
    assert!(dir.path().join("attachments").join(name).exists());
    assert_eq!(
        std::fs::read_dir(dir.path().join("backups"))
            .unwrap()
            .count(),
        0
    );
    let destination = dir.path().join("after-deletion.zip");
    archive::export(&db, &destination).unwrap();
    let imported = archive::inspect(&destination, dir.path()).unwrap();
    assert_eq!(imported.workspace["tasks"], json!([]));
    assert_eq!(imported.workspace["activities"], json!([]));
    assert!(!imported.workspace.to_string().contains("Discard"));
}

fn workspace_with_file(db: &mut Store) -> (Value, std::path::PathBuf) {
    let name = "00000000-0000-4000-8000-000000000002.txt";
    let path = db.root.join("attachments").join(name);
    std::fs::write(&path, "fixture").unwrap();
    let mut w = empty();
    w["topics"] = json!([topic()]);
    w["attachments"] = json!([{"id":"00000000-0000-4000-8000-000000000002","originalName":"fixture.txt","managedName":name,"mime":"text/plain","size":7,"addedAt":"2026-01-01T12:00:00Z","topicIds":[topic()["id"]],"taskIds":[],"activityIds":[],"sourceIds":[]}]);
    (db.save(w).unwrap(), path)
}
#[test]
fn confirmed_file_deletion_is_physical_and_survives_reopen_without_backup() {
    let dir = tempfile::tempdir().unwrap();
    let external = dir.path().join("external.txt");
    std::fs::write(&external, "original").unwrap();
    let mut db = Store::open(dir.path().into()).unwrap();
    let (mut w, path) = workspace_with_file(&mut db);
    w["attachments"] = json!([]);
    let result = db.save_with_cleanup(w, false, false).unwrap();
    assert!(result.cleanup_warning.is_none());
    assert!(!path.exists());
    assert!(external.exists());
    assert_eq!(
        std::fs::read_dir(dir.path().join("backups"))
            .unwrap()
            .count(),
        0
    );
    drop(db);
    let mut db = Store::open(dir.path().into()).unwrap();
    assert_eq!(db.load_with_cleanup().unwrap().workspace, result.workspace);
    assert_eq!(result.workspace["activities"], json!([]));
}
#[test]
fn failed_file_delete_stays_queued_across_reopen_and_retries() {
    let dir = tempfile::tempdir().unwrap();
    let mut db = Store::open(dir.path().into()).unwrap();
    let (mut w, path) = workspace_with_file(&mut db);
    // A directory at the filename makes remove_file fail on every platform.
    std::fs::remove_file(&path).unwrap();
    std::fs::create_dir(&path).unwrap();
    w["attachments"] = json!([]);
    let result = db.save_with_cleanup(w, false, false).unwrap();
    assert!(result
        .cleanup_warning
        .unwrap()
        .contains("could not be removed"));
    assert_eq!(db.load().unwrap()["attachments"], json!([]));
    drop(db);
    let mut db = Store::open(dir.path().into()).unwrap();
    assert!(db.load_with_cleanup().unwrap().cleanup_warning.is_some());
    std::fs::remove_dir(&path).unwrap();
    std::fs::write(&path, "fixture").unwrap();
    assert!(db.cleanup_deleted_files().unwrap().is_none());
    assert!(!path.exists());
    let pending: i64 = db
        .db
        .query_row("SELECT COUNT(*) FROM pending_file_deletions", [], |r| {
            r.get(0)
        })
        .unwrap();
    assert_eq!(pending, 0);
}
#[test]
fn stale_or_invalid_deletion_leaves_file_and_records_intact() {
    let dir = tempfile::tempdir().unwrap();
    let mut db = Store::open(dir.path().into()).unwrap();
    let (saved, path) = workspace_with_file(&mut db);
    let mut stale = saved.clone();
    stale["revision"] = json!(0);
    stale["attachments"] = json!([]);
    assert!(db.save_with_cleanup(stale, false, false).is_err());
    assert!(path.exists());
    assert_eq!(db.load().unwrap(), saved);
    let mut invalid = saved.clone();
    invalid["topics"] = json!([]);
    assert!(db.save_with_cleanup(invalid, false, false).is_err());
    assert!(path.exists());
    assert_eq!(db.load().unwrap(), saved);
    assert!(db.save_with_cleanup(saved.clone(), true, true).is_err());
    assert_eq!(db.load().unwrap(), saved);
}
#[test]
fn clear_all_removes_orphans_and_optionally_backups_but_never_originals() {
    for backups in [false, true] {
        let dir = tempfile::tempdir().unwrap();
        let mut db = Store::open(dir.path().into()).unwrap();
        let (saved, path) = workspace_with_file(&mut db);
        let orphan = dir
            .path()
            .join("attachments/00000000-0000-4000-8000-000000000003.txt");
        std::fs::write(&orphan, "orphan").unwrap();
        let backup = archive::backup(&db).unwrap();
        let external = dir.path().join("external.txt");
        std::fs::write(&external, "original").unwrap();
        let mut w = empty();
        w["revision"] = saved["revision"].clone();
        let result = db.save_with_cleanup(w, true, backups).unwrap();
        assert!(result.cleanup_warning.is_none());
        assert!(!path.exists());
        assert!(!orphan.exists());
        assert_eq!(backup.exists(), !backups);
        assert!(external.exists());
        assert_eq!(result.workspace["topics"], json!([]));
    }
}
#[test]
fn migration_two_preserves_version_one_records_and_live_files_cancel_old_jobs() {
    let dir = tempfile::tempdir().unwrap();
    let mut db = Store::open(dir.path().into()).unwrap();
    let (saved, path) = workspace_with_file(&mut db);
    db.db
        .execute_batch("DROP TABLE pending_file_deletions; PRAGMA user_version=1;")
        .unwrap();
    drop(db);
    let mut db = Store::open(dir.path().into()).unwrap();
    assert_eq!(db.load().unwrap(), saved);
    db.db
        .execute(
            "INSERT INTO pending_file_deletions VALUES('attachments',?1)",
            [path.file_name().unwrap().to_str().unwrap()],
        )
        .unwrap();
    assert!(db.cleanup_deleted_files().unwrap().is_none());
    assert!(path.exists());
    assert_eq!(db.load().unwrap(), saved);
}
#[cfg(unix)]
#[test]
fn cleanup_never_follows_replaced_managed_directory() {
    let dir = tempfile::tempdir().unwrap();
    let outside = tempfile::tempdir().unwrap();
    let mut db = Store::open(dir.path().into()).unwrap();
    let (mut w, path) = workspace_with_file(&mut db);
    let outside_file = outside.path().join(path.file_name().unwrap());
    std::fs::write(&outside_file, "external").unwrap();
    std::fs::remove_file(&path).unwrap();
    std::fs::remove_dir(dir.path().join("attachments")).unwrap();
    std::os::unix::fs::symlink(outside.path(), dir.path().join("attachments")).unwrap();
    w["attachments"] = json!([]);
    assert!(db
        .save_with_cleanup(w, false, false)
        .unwrap()
        .cleanup_warning
        .is_some());
    assert!(outside_file.exists());
}

#[test]
fn cleanup_intent_rolls_back_with_database_failure_and_missing_files_can_be_deleted() {
    let dir = tempfile::tempdir().unwrap();
    let mut db = Store::open(dir.path().into()).unwrap();
    let (saved, path) = workspace_with_file(&mut db);
    db.db.execute_batch("CREATE TRIGGER block_delete BEFORE DELETE ON attachments BEGIN SELECT RAISE(ABORT,'fixture failure'); END;").unwrap();
    let mut next = saved.clone();
    next["attachments"] = json!([]);
    assert!(db.save_with_cleanup(next.clone(), false, false).is_err());
    assert_eq!(db.load().unwrap(), saved);
    assert!(path.exists());
    let queued: i64 = db
        .db
        .query_row("SELECT COUNT(*) FROM pending_file_deletions", [], |r| {
            r.get(0)
        })
        .unwrap();
    assert_eq!(queued, 0);
    db.db.execute_batch("DROP TRIGGER block_delete;").unwrap();
    std::fs::remove_file(path).unwrap();
    assert!(db
        .save_with_cleanup(next, false, false)
        .unwrap()
        .cleanup_warning
        .is_none());
    assert_eq!(db.load().unwrap()["attachments"], json!([]));
}
