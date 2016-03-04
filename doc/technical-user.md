# Technical User

Technical users are used to communicate/authenticate on other platform components.
The current document defines how to configure these users.

## Constraints

- A technical user is bound to an OpenPaaS domain.

## Configuration

All the technical users are defined in the **technicalusers** MongoDB collection.

### Sabre DAV

```
{
  "name": "Sabre Dav",
  "description": "Allows to authenticate on Sabre DAV",
  "type": "dav",
  "domain": ObjectId("5665774f29e52f8e63a7eb47"),
  "data": {
    "principal": "principals/technicalUser"
  }
}
```
