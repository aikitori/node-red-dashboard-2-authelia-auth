0.0.1
- initial release

0.1.0
- rename package
- fix wording and typos
- make Readme usable
- refactor Header keys
- change user -> userID as unique identifier

0.1.1
- deserialize user groups

0.1.2
- optional chaining for groups to prevent exception

0.2.0
- only send messages with msg._client.user to connections of that user (onIsValidConnection)
- do not store messages with msg._client.user in the Dashboard data store (onCanSaveInStore)
- log via RED.log, interactions only on debug level
- remove @flowfuse/node-red-dashboard from dependencies
