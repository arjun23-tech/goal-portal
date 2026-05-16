from sqlalchemy.orm import Session
import crud, models

def seed_database(db: Session):
    # Clear existing data
    db.query(models.QuarterlyUpdate).delete()
    db.query(models.Goal).delete()
    db.query(models.User).delete()
    db.commit()

    # Create users
    admin = crud.create_user(db, "admin", "Alex Admin", "admin@company.com", "admin123", "admin", "IT")
    manager1 = crud.create_user(db, "manager1", "Sarah Manager", "sarah@company.com", "manager123", "manager", "Engineering")
    manager2 = crud.create_user(db, "manager2", "Tom Lead", "tom@company.com", "manager123", "manager", "Product")
    emp1 = crud.create_user(db, "john", "John Doe", "john@company.com", "emp123", "employee", "Engineering")
    emp2 = crud.create_user(db, "jane", "Jane Smith", "jane@company.com", "emp123", "employee", "Engineering")
    emp3 = crud.create_user(db, "mike", "Mike Johnson", "mike@company.com", "emp123", "employee", "Product")
    emp4 = crud.create_user(db, "lisa", "Lisa Wong", "lisa@company.com", "emp123", "employee", "Product")

    # Goals for John (approved)
    g1 = crud.create_goal(db, type('G', (), {'title': "Improve Code Coverage", 'description': "Increase unit test coverage across all modules", 'target': "90", 'uom': "%", 'weightage': 30.0})(), emp1.id)
    g2 = crud.create_goal(db, type('G', (), {'title': "Complete AWS Certification", 'description': "Pass AWS Solutions Architect exam", 'target': "1", 'uom': "Certification", 'weightage': 25.0})(), emp1.id)
    g3 = crud.create_goal(db, type('G', (), {'title': "Reduce Bug Backlog", 'description': "Close all P1/P2 bugs in backlog", 'target': "50", 'uom': "Bugs", 'weightage': 25.0})(), emp1.id)
    g4 = crud.create_goal(db, type('G', (), {'title': "Mentor Junior Developers", 'description': "Conduct weekly 1:1 sessions with junior devs", 'target': "48", 'uom': "Sessions", 'weightage': 20.0})(), emp1.id)

    for g in [g1, g2, g3, g4]:
        crud.update_goal_status(db, g.id, "submitted")
        crud.update_goal_status(db, g.id, "approved", reviewed_by=manager1.id)

    # Quarterly updates for John
    crud.create_update(db, type('U', (), {'goal_id': g1.id, 'quarter': 'Q1', 'achievement': '75', 'notes': 'Good progress on unit tests'})(), emp1.id)
    crud.create_update(db, type('U', (), {'goal_id': g1.id, 'quarter': 'Q2', 'achievement': '82', 'notes': 'Added integration tests'})(), emp1.id)
    crud.create_update(db, type('U', (), {'goal_id': g2.id, 'quarter': 'Q1', 'achievement': '0', 'notes': 'Started studying'})(), emp1.id)
    crud.create_update(db, type('U', (), {'goal_id': g2.id, 'quarter': 'Q2', 'achievement': '1', 'notes': 'Passed the exam!'})(), emp1.id)

    # Goals for Jane (submitted - pending approval)
    g5 = crud.create_goal(db, type('G', (), {'title': "Deliver API Gateway Project", 'description': "Complete API gateway migration project", 'target': "100", 'uom': "%", 'weightage': 35.0})(), emp2.id)
    g6 = crud.create_goal(db, type('G', (), {'title': "Performance Optimization", 'description': "Reduce API response time by 30%", 'target': "30", 'uom': "% Reduction", 'weightage': 30.0})(), emp2.id)
    g7 = crud.create_goal(db, type('G', (), {'title': "Documentation Coverage", 'description': "Achieve 100% API documentation coverage", 'target': "100", 'uom': "%", 'weightage': 20.0})(), emp2.id)
    g8 = crud.create_goal(db, type('G', (), {'title': "Sprint Velocity Increase", 'description': "Improve team sprint velocity", 'target': "15", 'uom': "Story Points", 'weightage': 15.0})(), emp2.id)

    for g in [g5, g6, g7, g8]:
        crud.update_goal_status(db, g.id, "submitted")

    # Goals for Mike (draft)
    crud.create_goal(db, type('G', (), {'title': "Product Roadmap Q3", 'description': "Define and document Q3 product roadmap", 'target': "1", 'uom': "Document", 'weightage': 40.0})(), emp3.id)
    crud.create_goal(db, type('G', (), {'title': "User Research Sessions", 'description': "Conduct customer interviews", 'target': "20", 'uom': "Interviews", 'weightage': 35.0})(), emp3.id)
    crud.create_goal(db, type('G', (), {'title': "NPS Score Improvement", 'description': "Improve product NPS score", 'target': "55", 'uom': "Score", 'weightage': 25.0})(), emp3.id)

    db.commit()
    print("✅ Database seeded with demo users and goals!")
    print("\nDemo Credentials:")
    print("  Admin:    admin / admin123")
    print("  Manager:  manager1 / manager123")
    print("  Employee: john / emp123  (approved goals)")
    print("  Employee: jane / emp123  (submitted goals)")
    print("  Employee: mike / emp123  (draft goals)")
