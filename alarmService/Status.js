export enum StatusIndividual {
    Notified = 'Notified', // The user was notified
    CheckedByUser = 'CheckedByUser', // The user was notified and check the notification
    Ok = 'Ok' // Its all working normally
}
export type Devices = {
    gateway: [];
    sensor: [];
  };