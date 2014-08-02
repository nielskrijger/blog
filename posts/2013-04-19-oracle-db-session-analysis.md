# Oracle DB session analysis

After experiencing some troubles with blocking sessions in Oracle DB I needed to analyze what the database sessions were doing. I made a query showing the more interesting session details and metrics:

- Session details like machine, user, sid, ...
- Blocking status
- Number of hours running
- Average hourly IO count (our DBA is always pointing to limiting our IO, but I've never actually measured it)
- Average hourly processing time in milliseconds
- Program memory usage (PGA only)

(tested on Oracle Database 11g Enterprise Edition Release 11.2.0.3.0)

    WITH
      sess_time AS (
        SELECT sid, ROUND(SUM(value) / 1000, 0) AS milliseconds
        FROM gv$sess_time_model
        GROUP BY sid),
      sess_io AS (
        SELECT sid, block_gets + consistent_gets + physical_reads + block_changes + consistent_changes + optimized_physical_reads AS io#
        FROM gv$sess_io io)
    SELECT
      p.spid, -- The system process identifier
      s.sid, -- The session identifier
      s.serial#,
      /*
        Status:
        - ACTIVE - Session currently executing SQL
        - INACTIVE
        - KILLED - Session marked to be killed
        - CACHED - Session temporarily cached for use by Oracle*XA
        - SNIPED - Session inactive, waiting on the client
        */
      s.status,
      s.machine,
      s.username,
      s.osuser,
      s.program, -- The program in process
      /*
        The blocking session status indicates whether there is a blocking session. Values are:
        - VALID - there is a blocking session, and it is identified in the BLOCKING_INSTANCE and BLOCKING_SESSION columns
        - NO HOLDER - there is no session blocking this session
        - NOT IN WAIT - this session is not in a wait
        - UNKNOWN - the blocking session is unknown
      */
      s.blocking_session_status,
      ROUND((SYSDATE - s.logon_time) * 24, 1) AS "HOURS LOGGED ON",
      ROUND(sess_io.io#  / (SYSDATE - s.logon_time) / 24, 0) AS "AVG HOURLY IO#",
      ROUND(sess_time.milliseconds  / (SYSDATE - s.logon_time) / 24, 0) AS "AVG HOURLY PROCESS TIME (ms)",
      ROUND(p.pga_used_mem / 1024, 0) AS "PGA USED MEM (kB)" -- Program global area memory space usage in KB
    FROM
      gv$session s,
      sess_time,
      gv$process p,
      sess_io
    WHERE
      s.paddr = p.addr
      AND sess_time.sid = s.sid
      AND sess_io.sid = s.sid
      AND s.type != 'BACKGROUND' -- Exclude BACKGROUND processes, usually they just clutter the result
    ORDER BY
      s.status ASC;

Or view on [Github](https://gist.github.com/5419516.git).
