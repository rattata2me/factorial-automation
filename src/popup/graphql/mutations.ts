import { gql } from '@apollo/client';

export const CREATE_ATTENDANCE_SHIFT = gql`
  mutation CreateAttendanceShift(
    $clockIn: ISO8601DateTime
    $clockOut: ISO8601DateTime
    $date: ISO8601Date!
    $employeeId: Int!
    $fetchDependencies: Boolean!
    $halfDay: String
    $locationType: AttendanceShiftLocationTypeEnum
    $observations: String
    $referenceDate: ISO8601Date!
    $source: AttendanceEnumsShiftSourceEnum
    $timeSettingsBreakConfigurationId: Int
    $workable: Boolean
  ) {
    attendanceMutations {
      createAttendanceShift(
        clockIn: $clockIn
        clockOut: $clockOut
        date: $date
        employeeId: $employeeId
        halfDay: $halfDay
        locationType: $locationType
        observations: $observations
        referenceDate: $referenceDate
        source: $source
        timeSettingsBreakConfigurationId: $timeSettingsBreakConfigurationId
        workable: $workable
      ) {
        errors {
          ...ErrorDetails
        }
        shift {
          id
          clockIn
          clockOut
          date
          employeeId
          employee @include(if: $fetchDependencies) {
            id
            attendanceBalancesConnection(endOn: $referenceDate, startOn: $referenceDate) {
              nodes {
                id
                dailyBalance
                date
              }
            }
            attendanceWorkedTimesConnection(endOn: $referenceDate, startOn: $referenceDate) {
              nodes {
                id
                minutes
                date
              }
            }
          }
          timeSettingsBreakConfiguration {
            id
            paid
          }
        }
      }
    }
  }

  fragment ErrorDetails on MutationError {
    ... on SimpleError {
      message
      type
    }
    ... on StructuredError {
      field
      messages
    }
  }
`;

export interface CreateAttendanceShiftVariables {
  clockIn: string;
  clockOut: string;
  date: string;
  employeeId: number;
  fetchDependencies: boolean;
  referenceDate: string;
  source: 'desktop';
  timeSettingsBreakConfigurationId?: number;
  workable: boolean;
}

export interface CreateAttendanceShiftResponse {
  attendanceMutations: {
    createAttendanceShift: {
      errors: Array<{
        message?: string;
        type?: string;
        field?: string;
        messages?: string[];
      }> | null;
      shift: {
        id: string;
        clockIn: string;
        clockOut: string;
        date: string;
        employeeId: number;
        employee?: {
          id: number;
          attendanceBalancesConnection: {
            nodes: Array<{
              id: string;
              dailyBalance: number;
              date: string;
            }>;
          };
          attendanceWorkedTimesConnection: {
            nodes: Array<{
              id: string;
              minutes: number;
              date: string;
            }>;
          };
        };
        timeSettingsBreakConfiguration: {
          id: number;
          paid: boolean;
        } | null;
      } | null;
    };
  };
}
