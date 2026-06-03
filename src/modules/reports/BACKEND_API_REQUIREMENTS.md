# Performance Reports Backend Requirements

This frontend calls `POST /api/v1/reports/user-performance`.

## Request

```json
{
  "user_id": "",
  "from_date": "",
  "to_date": "",
  "company_id": "",
  "ticket_status": "",
  "page": 1,
  "limit": 10,
  "searchText": "",
  "order_by": "created_date",
  "order": "DESC"
}
```

## Response

```json
{
  "success": true,
  "data": {
    "user": {
      "adminID": 12,
      "name": "Rahul Sharma",
      "email": "rahul@example.com"
    },
    "summary": {
      "assigned": 120,
      "closed": 95,
      "pending": 25,
      "overdue": 4,
      "avg_resolution_time": 3.5,
      "productivity_score": 82
    },
    "charts": {
      "monthlyProductivity": [],
      "ticketStatusDistribution": [],
      "dailyClosureTrend": [],
      "pendingVsClosed": {
        "pending": 25,
        "closed": 95
      }
    },
    "tickets": [],
    "activities": [],
    "pagination": {
      "page": 1,
      "totalPages": 1,
      "total": 0
    }
  }
}
```

## Summary SQL

```sql
SELECT
  COUNT(*) AS assigned,
  SUM(CASE WHEN ticket_status = :closed_status THEN 1 ELSE 0 END) AS closed,
  SUM(CASE WHEN ticket_status <> :closed_status THEN 1 ELSE 0 END) AS pending,
  SUM(CASE WHEN due_date < CURRENT_DATE AND ticket_status <> :closed_status THEN 1 ELSE 0 END) AS overdue,
  AVG(TIMESTAMPDIFF(HOUR, created_date, modified_date)) AS avg_resolution_time,
  (
    SUM(CASE WHEN ticket_status = :closed_status THEN 1 ELSE 0 END) * 2
  ) - (
    SUM(CASE WHEN due_date < CURRENT_DATE AND ticket_status <> :closed_status THEN 1 ELSE 0 END) * 1.5
  ) AS productivity_score
FROM tickets
WHERE assignee = :user_id
  AND (:from_date = '' OR DATE(created_date) >= :from_date)
  AND (:to_date = '' OR DATE(created_date) <= :to_date)
  AND (:company_id = '' OR company_id = :company_id)
  AND (:ticket_status = '' OR ticket_status = :ticket_status);
```

## Optional Activity Table

```sql
CREATE TABLE ticket_activity_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  ticket_id BIGINT NOT NULL,
  action_by BIGINT NOT NULL,
  old_status VARCHAR(100),
  new_status VARCHAR(100),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ticket_activity_ticket (ticket_id),
  INDEX idx_ticket_activity_user_date (action_by, created_at)
);
```

Insert into this table whenever ticket status changes.

## Permissions

Use the existing menu permission map for the Reports menu.

Recommended flags:

- `view` / `can_view`
- `can_view_reports`
- `can_export_reports`

