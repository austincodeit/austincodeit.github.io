SELECT a.foldernumber,
       a.foldersubtype,
       a.status,
       a.owner,
       a.issuedate,
       a.establishmentname,
       a.propertyname,
       a.foldername,
       a.parcelID,
       coa_folder.f_get_info_string(a.folderrsn, 53000) AS NumberOfUnits,
       a.registrationamount,
       a.totalamountpaid,
       a.outstandingamount,
       b.currentviolations AS activeviolations,
       c.totalviolations,
       a.councildistrict,
       a.longitude,
       a.latitude
 FROM (SELECT foldernumber,
               folderrsn,
               foldersubtype,
               status,
               owner,
               issuedate,
               expirydate,
               INITCAP(establishmentname) AS establishmentname,
               propertyname,
               foldername,
               parcelID,
               to_char(SUM(feeamount), '$999,999.00') AS registrationamount,
               to_char(SUM(totalpaid), '$999,999.00') AS totalamountpaid,
               to_char(SUM(feeamount) - SUM(totalpaid), '$999,999.00') AS outstandingamount,
               councildistrict,
               longitude,
               latitude
          FROM (SELECT foldercentury || folderyear || '-' || foldersequence || ' ' ||
                       foldertype AS foldernumber,
                       (SELECT subdesc
                        FROM validsub vs
                        WHERE vs.subcode = f.subcode) AS foldersubtype,
                       (SELECT vs.statusdesc
                        FROM validstatus vs
                        WHERE vs.statuscode = f.statuscode) AS status,
                       (SELECT MAX(UPPER(CASE
                                           WHEN NAMEFIRST || ' ' || NAMELAST != ' ' THEN
                                            NAMEFIRST || ' ' || NAMELAST
                                           ELSE
                                            ORGANIZATIONNAME
                                         END)) AS case_contact
                        FROM folderpeople fp, people p
                        WHERE fp.peoplecode = 2
                        AND p.peoplersn = fp.peoplersn
                        AND f.folderrsn = fp.folderrsn) AS owner,
                       coa_folder.f_get_info_string(f.folderrsn, 53017) AS EstablishmentName,
                       f.folderrsn,
                       f.issuedate,
                       f.expirydate,
                       p.propertyname,
                       p.propertyroll AS parcelID,
                       f.foldername,
                       V.FEEDESC,
                       TRUNC(AB.DATEGENERATED) DATEGENERATED,
                       ABF.FeeAmount,
                       AB.TotalPaid,
                       AB.BILLAMOUNT - AB.TotalPaid AS OutstandingFee,
                       p.gpslongitude LONGITUDE,
                       p.gpslatitude LATITUDE,
                       pi.propinfovalue COUNCILDISTRICT
                
                  FROM folder          f,
                       property        p,
                       propertyinfo    pi,
                       ACCOUNTBILL     AB,
                       accountbillfee  abf,
                       validaccountfee v
                 WHERE p.propertyrsn = f.propertyrsn
                   AND p.propertyrsn = pi.propertyrsn
                   AND pi.propertyinfocode = 52026 -- Council District
                   AND p.propertyroll <> '0307110121'   -- INC0101270 Update to handle 2 Licenses with same propertyroll
                   AND f.FOLDERRSN = AB.FOLDERRSN
                   AND foldertype = 'OL'
                   AND subcode IN (53045, 53050)
                   AND f.statuscode IN (50010, 53005) --Active, Suspended
                   AND ABF.folderrsn = AB.FOLDERRSN
                   AND ABF.BILLNUMBER = AB.BILLNUMBER
                   AND V.FEECODE = ABF.FEECODE
                   AND ab.paidinfullflag NOT IN ('C', 'V'))
         GROUP BY foldernumber,
                  folderrsn,
                  foldersubtype,
                  status,
                  owner,
                  issuedate,
                  expirydate,
                  establishmentname,
                  propertyname,
                  parcelID,
                  foldername,
                  councildistrict,
                  longitude,
                  latitude) a

-- Here we get the ACTIVE Violations (deficiency status of 'Not Cleared') since OL Folder Issue Date

  LEFT JOIN (SELECT parcelID, COUNT(DEFICIENCYSTATUS) AS currentviolations
             FROM   (SELECT p.propertyroll AS parcelID,
                    
                     VDS.STATUSDESC AS DEFICIENCYSTATUS
                    
                     FROM Folder fcv, 
                     folderprocessdeficiency fpd,
                     folderprocess fp, 
                     property p, 
                     VALIDPROCESS VP,
                     VALIDDEFICIENCYSTATUS VDS 
                     WHERE fcv.foldertype = 'CV' 
                     AND fcv.subcode = 52001 
                     AND fp.folderrsn = fcv.folderrsn 
                     AND fp.processrsn = fpd.processrsn 
                     AND fp.processcode IN (52071, 52072, 52074, 52076) 
                     AND fpd.statuscode = 55300 -- Not Cleared
                     AND VDS.STATUSCODE = FPD.STATUSCODE 
                     AND VP.PROCESSCODE = FP.PROCESSCODE 
                     AND fpd.folderrsn = fcv.folderrsn 
                     AND fcv.propertyrsn = p.propertyrsn 
                     AND p.propertyroll <> '0307110121'   -- INC0101270 Update to handle 2 Licenses with same propertyroll
                     AND TRUNC(fpd.insertdate) >=
                         (SELECT TRUNC(fol.issuedate)
                                 FROM folder fol
                                 JOIN property pol ON pol.propertyrsn = fol.propertyrsn
                                 WHERE p.propertyroll = pol.propertyroll
                                 AND pol.propertyroll <> '0307110121'   -- INC0101270 Update to handle 2 Licenses with same propertyroll
                                 AND fol.foldertype = 'OL'
                                 AND fol.subcode IN (53045, 53050) --ROP 2 and 5 year
                                 AND fol.statuscode IN (50010, 53005)) -- Active, Suspended
                                 AND p.propertyroll IN
                                     (SELECT p.propertyroll
                                      FROM property p, folder f
                                      WHERE p.propertyrsn = f.propertyrsn
                                      AND f.foldertype = 'OL'
                                      AND f.subcode IN (53045, 53050) --ROP 2 and 5 year
                                      AND f.statuscode IN (50010, 53005)) -- Active, Suspended
                    
                     UNION ALL -- Get the CC folder deficiencies
                    
                     SELECT p.propertyroll, 
                            VDS.STATUSDESC AS DEFICIENCYSTATUS
                    
                     FROM Folder fcc, 
                          folderprocessdeficiency fpd,
                          folderprocess fp, 
                          property p, 
                          VALIDPROCESS VP,
                          VALIDDEFICIENCYSTATUS VDS 
                     WHERE fcc.foldertype = 'CC' 
                     AND fcc.subcode = 52002 
                     AND fp.processrsn = fpd.processrsn 
                     AND fp.processcode IN (52005) 
                     AND fpd.statuscode = 55300 --Not Cleared
                     AND fpd.folderrsn = fcc.folderrsn
                     AND VDS.STATUSCODE = FPD.STATUSCODE 
                     AND VP.PROCESSCODE = FP.PROCESSCODE
                     AND fcc.propertyrsn = p.propertyrsn 
                     AND p.propertyroll <> '0307110121'   -- INC0101270 Update to handle 2 Licenses with same propertyroll
                     AND TRUNC(fpd.insertdate) >=
                           (SELECT TRUNC(fol.issuedate)
                            FROM folder fol
                            JOIN property pol ON pol.propertyrsn = fol.propertyrsn
                            WHERE p.propertyroll = pol.propertyroll
                            AND pol.propertyroll <> '0307110121'    -- INC0101270 Update to handle 2 Licenses with same propertyroll
                            AND fol.foldertype = 'OL'
                            AND fol.subcode IN (53045, 53050) --ROP 2 and 5 year
                            AND fol.statuscode IN (50010, 53005)) 
                            AND p.propertyroll IN
                                       (SELECT p.propertyroll
                                        FROM property p, folder f
                                        WHERE p.propertyrsn = f.propertyrsn
                                        AND f.foldertype = 'OL'
                                        AND f.subcode IN (53045, 53050) --ROP 2 and 5 year
                                        AND f.statuscode IN (50010, 53005)) -- Active, Suspended
                    )
                    GROUP BY parcelID) b ON a.parcelID = b.parcelID

-- Here we get the Total Violations (deficiencies 'Not Cleared' or 'Cleared') since OL Folder Issue Date

LEFT JOIN (SELECT parcelID, COUNT(DEFICIENCYSTATUS) AS totalviolations
           FROM (SELECT p.propertyroll AS parcelID,
                        VDS.STATUSDESC AS DEFICIENCYSTATUS
                     
                 FROM Folder fcv,
                      folderprocessdeficiency fpd,
                      folderprocess           fp,
                      property                p,
                      VALIDPROCESS            VP,
                      VALIDDEFICIENCYSTATUS   VDS
                 WHERE fcv.foldertype = 'CV'
                 AND fcv.subcode = 52001
                 AND fp.folderrsn = fcv.folderrsn
                 AND fp.processrsn = fpd.processrsn
                 AND fp.processcode IN (52071, 52072, 52074, 52076)
                 AND fpd.statuscode IN (55310, 55300) -- Cleared, Not Cleared
                 AND VDS.STATUSCODE = FPD.STATUSCODE
                 AND VP.PROCESSCODE = FP.PROCESSCODE
                 AND fpd.folderrsn = fcv.folderrsn
                 AND fcv.propertyrsn = p.propertyrsn
                 AND p.propertyroll <> '0307110121'   -- INC0101270 Update to handle 2 Licenses with same propertyroll
                 AND TRUNC(fpd.insertdate) >=
                            (SELECT TRUNC(fol.issuedate)
                             FROM folder fol
                             JOIN property pol ON pol.propertyrsn = fol.propertyrsn
                             WHERE p.propertyroll = pol.propertyroll
                             AND pol.propertyroll <> '0307110121'   -- INC0101270 Update to handle 2 Licenses with same propertyroll
                             AND fol.foldertype = 'OL'
                             AND fol.subcode IN (53045, 53050) --ROP 2 and 5 year
                             AND fol.statuscode IN (50010, 53005))
                             AND p.propertyroll IN
                                 (SELECT p.propertyroll
                                  FROM property p, folder f
                                  WHERE p.propertyrsn = f.propertyrsn
                                  AND f.foldertype = 'OL'
                                  AND f.subcode IN (53045, 53050) --ROP 2 and 5 year
                                  AND f.statuscode IN (50010, 53005)) -- Active, Suspended
                     
                     UNION ALL -- Get the CC folder deficiencies
                     
                     SELECT p.propertyroll,
                            VDS.STATUSDESC AS DEFICIENCYSTATUS
                     
                     FROM Folder                  fcc,
                          folderprocessdeficiency fpd,
                          folderprocess           fp,
                          property                p,
                          VALIDPROCESS            VP,
                          VALIDDEFICIENCYSTATUS   VDS
                      WHERE fcc.foldertype = 'CC'
                      AND fcc.subcode = 52002
                      AND fp.processrsn = fpd.processrsn
                      AND fp.processcode IN (52005)
                      AND fpd.statuscode IN (55310, 55300) -- Cleared, Not Cleared
                      AND fpd.folderrsn = fcc.folderrsn
                      AND VDS.STATUSCODE = FPD.STATUSCODE
                      AND VP.PROCESSCODE = FP.PROCESSCODE
                      AND fcc.propertyrsn = p.propertyrsn
                      AND p.propertyroll <> '0307110121'   -- INC0101270 Update to handle 2 Licenses with same propertyroll
                      AND TRUNC(fpd.insertdate) >=
                               (SELECT TRUNC(fol.issuedate)
                                FROM folder fol
                                JOIN property pol ON pol.propertyrsn = fol.propertyrsn
                                WHERE p.propertyroll = pol.propertyroll
                                AND pol.propertyroll <> '0307110121'   -- INC0101270 Update to handle 2 Licenses with same propertyroll
                                AND fol.foldertype = 'OL'
                                AND fol.subcode IN (53045, 53050) --ROP 2 and 5 year
                                AND fol.statuscode IN (50010, 53005))
                                AND p.propertyroll IN
                               (SELECT p.propertyroll
                                FROM property p, folder f
                                WHERE p.propertyrsn = f.propertyrsn
                                AND f.foldertype = 'OL'
                                AND f.subcode IN (53045, 53050) --ROP 2 and 5 year
                                AND f.statuscode IN (50010, 53005)) -- Active, Suspended
                     )
              GROUP BY parcelID) c ON a.parcelID = c.parcelID

UNION

SELECT a.foldernumber,
       a.foldersubtype,
       a.status,
       a.owner,
       a.issuedate,
       a.establishmentname,
       a.propertyname,
       a.foldername,
       a.parcelID,
       coa_folder.f_get_info_string(a.folderrsn, 53000) AS NumberOfUnits,
       a.registrationamount,
       a.totalamountpaid,
       a.outstandingamount,
       b.currentviolations AS activeviolations,
       c.totalviolations,
       a.councildistrict,
       a.longitude,
       a.latitude
  FROM (SELECT propstreet,
               foldernumber,
               folderrsn,
               foldersubtype,
               status,
               owner,
               issuedate,
               expirydate,
               INITCAP(establishmentname) AS establishmentname,
               propertyname,
               foldername,
               parcelID,
               to_char(SUM(feeamount), '$999,999.00') AS registrationamount,
               to_char(SUM(totalpaid), '$999,999.00') AS totalamountpaid,
               to_char(SUM(feeamount) - SUM(totalpaid), '$999,999.00') AS outstandingamount,
               councildistrict,
               longitude,
               latitude
          FROM (SELECT p.propstreet,
                       foldercentury || folderyear || '-' || foldersequence || ' ' ||
                       foldertype AS foldernumber,
                       (SELECT subdesc
                        FROM validsub vs
                        WHERE vs.subcode = f.subcode) AS foldersubtype,
                       (SELECT vs.statusdesc
                        FROM validstatus vs
                        WHERE vs.statuscode = f.statuscode) AS status,
                       (SELECT MAX(UPPER(CASE WHEN NAMEFIRST || ' ' || NAMELAST != ' ' 
                                              THEN NAMEFIRST || ' ' || NAMELAST
                                              ELSE ORGANIZATIONNAME
                                          END)) AS case_contact
                         FROM folderpeople fp, people p
                         WHERE fp.peoplecode = 2
                         AND p.peoplersn = fp.peoplersn
                         AND f.folderrsn = fp.folderrsn) AS owner,
                       coa_folder.f_get_info_string(f.folderrsn, 53017) AS EstablishmentName,
                       f.folderrsn,
                       f.issuedate,
                       f.expirydate,
                       p.propertyname,
                       p.propertyroll AS parcelID,
                       f.foldername,
                       V.FEEDESC,
                       TRUNC(AB.DATEGENERATED) DATEGENERATED,
                       ABF.FeeAmount,
                       AB.TotalPaid,
                       AB.BILLAMOUNT - AB.TotalPaid AS OutstandingFee,
                       p.gpslongitude LONGITUDE,
                       p.gpslatitude LATITUDE,
                       pi.propinfovalue COUNCILDISTRICT
                
                  FROM folder          f,
                       property        p,
                       propertyinfo   pi, 
                       ACCOUNTBILL     AB,
                       accountbillfee  abf,
                       validaccountfee v
                   WHERE p.propertyrsn = f.propertyrsn
                   AND pi.propertyrsn = p.propertyrsn
                   AND pi.propertyinfocode = 52026
                   AND p.propertyroll = '0307110121'   -- INC0101270 Update to handle 2 Licenses with same propertyroll
                   AND f.FOLDERRSN = AB.FOLDERRSN
                   AND foldertype = 'OL'
                   AND subcode IN (53045, 53050)
                   AND f.statuscode IN (50010, 53005) --Active, Suspended
                   AND ABF.folderrsn = AB.FOLDERRSN
                   AND ABF.BILLNUMBER = AB.BILLNUMBER
                   AND V.FEECODE = ABF.FEECODE
                   AND ab.paidinfullflag NOT IN ('C', 'V'))
         GROUP BY propstreet,
                  foldernumber,
                  folderrsn,
                  foldersubtype,
                  status,
                  owner,
                  issuedate,
                  expirydate,
                  establishmentname,
                  propertyname,
                  parcelID,
                  foldername,
                  councildistrict,
                  longitude,
                  latitude) a

-- Here we get the ACTIVE Violations (deficiency status of 'Not Cleared') since OL Folder Issue Date

LEFT JOIN (SELECT parcelID, COUNT(DEFICIENCYSTATUS) AS currentviolations
           FROM (SELECT p.propstreet AS parcelID, --join on propstreet
                        VDS.STATUSDESC AS DEFICIENCYSTATUS
                 FROM Folder                  fcv,
                      folderprocessdeficiency fpd,
                      folderprocess           fp,
                      property                p,
                      VALIDPROCESS            VP,
                      VALIDDEFICIENCYSTATUS   VDS
                 WHERE fcv.foldertype = 'CV'
                 AND fcv.subcode = 52001
                 AND fp.folderrsn = fcv.folderrsn
                 AND fp.processrsn = fpd.processrsn
                 AND fp.processcode IN (52071, 52072, 52074, 52076)
                 AND fpd.statuscode = 55300 -- Not Cleared
                 AND VDS.STATUSCODE = FPD.STATUSCODE
                 AND VP.PROCESSCODE = FP.PROCESSCODE
                 AND fpd.folderrsn = fcv.folderrsn
                 AND fcv.propertyrsn = p.propertyrsn
                 AND p.propertyroll = '0307110121'   -- INC0101270 Update to handle 2 Licenses with same propertyroll
                 AND TRUNC(fpd.insertdate) >=
                              (SELECT TRUNC(fol.issuedate)
                               FROM folder fol
                               JOIN property pol ON pol.propertyrsn = fol.propertyrsn
                               WHERE p.propertyroll = pol.propertyroll
                               AND pol.propertyroll = '0307110121'   -- INC0101270 Update to handle 2 Licenses with same propertyroll
                               AND pol.propstreet = p.propstreet
                               AND fol.foldertype = 'OL'
                               AND fol.subcode IN (53045, 53050) --ROP 2 and 5 year
                               AND fol.statuscode IN (50010, 53005)) -- Active, Suspended
                     
                     UNION ALL -- Get the CC folder deficiencies
                     
                     SELECT p.propstreet   ParcelID,
                            VDS.STATUSDESC AS DEFICIENCYSTATUS
                     
                     FROM Folder                  fcc,
                          folderprocessdeficiency fpd,
                          folderprocess           fp,
                          property                p,
                          VALIDPROCESS            VP,
                          VALIDDEFICIENCYSTATUS   VDS
                      WHERE fcc.foldertype = 'CC'
                      AND fcc.subcode = 52002
                      AND fp.processrsn = fpd.processrsn
                      AND fp.processcode IN (52005)
                      AND fpd.statuscode = 55300 --Not Cleared
                      AND fpd.folderrsn = fcc.folderrsn
                      AND VDS.STATUSCODE = FPD.STATUSCODE
                      AND VP.PROCESSCODE = FP.PROCESSCODE
                      AND fcc.propertyrsn = p.propertyrsn
                      AND p.propertyroll = '0307110121'   -- INC0101270 Update to handle 2 Licenses with same propertyroll
                      AND TRUNC(fpd.insertdate) >=
                               (SELECT TRUNC(fol.issuedate)
                                FROM folder fol
                                JOIN property pol ON pol.propertyrsn = fol.propertyrsn
                                WHERE p.propertyroll = pol.propertyroll
                                AND pol.propertyroll = '0307110121'   -- INC0101270 Update to handle 2 Licenses with same propertyroll
                                AND fol.foldertype = 'OL'
                                AND pol.propstreet = p.propstreet
                                AND fol.subcode IN (53045, 53050) --ROP 2 and 5 year
                                AND fol.statuscode IN (50010, 53005))
                     -- Active, Suspended
                     )
              GROUP BY parcelID) b ON a.propstreet = b.parcelID

-- Here we get the Total Violations (deficiencies 'Not Cleared' or 'Cleared') since OL Folder Issue Date

LEFT JOIN (SELECT parcelID, COUNT(DEFICIENCYSTATUS) AS totalviolations
           FROM (SELECT p.propstreet AS parcelID,     
                        VDS.STATUSDESC AS DEFICIENCYSTATUS
                     
                 FROM Folder                  fcv,
                      folderprocessdeficiency fpd,
                      folderprocess           fp,
                      property                p,
                      VALIDPROCESS            VP,
                      VALIDDEFICIENCYSTATUS   VDS
                 WHERE fcv.foldertype = 'CV'
                 AND fcv.subcode = 52001
                 AND fp.folderrsn = fcv.folderrsn
                 AND fp.processrsn = fpd.processrsn
                 AND fp.processcode IN (52071, 52072, 52074, 52076)
                 AND fpd.statuscode IN (55310, 55300) -- Cleared, Not Cleared
                 AND VDS.STATUSCODE = FPD.STATUSCODE
                 AND VP.PROCESSCODE = FP.PROCESSCODE
                 AND fpd.folderrsn = fcv.folderrsn
                 AND fcv.propertyrsn = p.propertyrsn
                 AND p.propertyroll = '0307110121'   -- INC0101270 Update to handle 2 Licenses with same propertyroll
                 AND TRUNC(fpd.insertdate) >=
                            (SELECT TRUNC(fol.issuedate)
                             FROM folder fol
                             JOIN property pol ON pol.propertyrsn = fol.propertyrsn
                             WHERE p.propertyroll = pol.propertyroll
                             AND pol.propertyroll = '0307110121'   -- INC0101270 Update to handle 2 Licenses with same propertyroll
                             AND pol.propstreet = p.propstreet
                             AND fol.foldertype = 'OL'
                             AND fol.subcode IN (53045, 53050) --ROP 2 and 5 year
                             AND fol.statuscode IN (50010, 53005))
                     
                     UNION ALL -- Get the CC folder deficiencies
                     
                     SELECT p.propstreet ParcelId,
                            VDS.STATUSDESC AS DEFICIENCYSTATUS
                     
                     FROM Folder                  fcc,
                          folderprocessdeficiency fpd,
                          folderprocess           fp,
                          property                p,
                          VALIDPROCESS            VP,
                          VALIDDEFICIENCYSTATUS   VDS
                      WHERE fcc.foldertype = 'CC'
                      AND fcc.subcode = 52002
                      AND fp.processrsn = fpd.processrsn
                      AND fp.processcode in (52005)
                      AND fpd.statuscode in (55310, 55300) -- Cleared, Not Cleared
                      AND fpd.folderrsn = fcc.folderrsn
                      AND VDS.STATUSCODE = FPD.STATUSCODE
                      AND VP.PROCESSCODE = FP.PROCESSCODE
                      AND fcc.propertyrsn = p.propertyrsn
                      AND p.propertyroll = '0307110121'   -- INC0101270 Update to handle 2 Licenses with same propertyroll
                      AND TRUNC(fpd.insertdate) >=
                            (SELECT TRUNC(fol.issuedate)
                             FROM folder fol
                             JOIN property pol ON pol.propertyrsn = fol.propertyrsn
                             WHERE p.propertyroll = pol.propertyroll
                             AND pol.propertyroll = '0307110121'    -- INC0101270 Update to handle 2 Licenses with same propertyroll
                             AND pol.propstreet = p.propstreet
                             AND fol.foldertype = 'OL'
                             AND fol.subcode IN (53045, 53050) --ROP 2 and 5 year
                             AND fol.statuscode IN (50010, 53005))
                     -- Active, Suspended
                     )
              GROUP BY parcelID) c ON a.propstreet = c.parcelID