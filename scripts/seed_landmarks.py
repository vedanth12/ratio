"""Seed list of landmark Indian cases by subject.
Run: python3 scripts/seed_landmarks.py  -> merges into data/cases.json
Each row: name, citation, year, subject, topic, one-line principle (own words).
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from casedb import load, save, add

L = [
# Constitutional law
("A.K. Gopalan v. State of Madras","AIR 1950 SC 27",1950,"Constitutional Law","Article 21","Fundamental rights read as separate codes; narrow reading of 'procedure established by law' (later overruled)"),
("State of Madras v. Champakam Dorairajan","AIR 1951 SC 226",1951,"Constitutional Law","Equality and reservation","Communal G.O. on college admissions struck down; led to the First Amendment adding Article 15(4)"),
("Shankari Prasad v. Union of India","AIR 1951 SC 458",1951,"Constitutional Law","Amendment power","Parliament can amend fundamental rights; 'law' in Article 13 excludes constitutional amendments"),
("Romesh Thappar v. State of Madras","AIR 1950 SC 124",1950,"Constitutional Law","Free speech","Freedom of speech includes freedom of circulation; ban on a journal struck down"),
("Golak Nath v. State of Punjab","AIR 1967 SC 1643",1967,"Constitutional Law","Amendment power","Parliament cannot amend fundamental rights (overruled by Kesavananda)"),
("Kesavananda Bharati v. State of Kerala","(1973) 4 SCC 225",1973,"Constitutional Law","Basic structure","Parliament can amend any part of the Constitution but not its basic structure"),
("Indira Nehru Gandhi v. Raj Narain","1975 Supp SCC 1",1975,"Constitutional Law","Basic structure","Free and fair elections are part of the basic structure; Article 329A(4) struck down"),
("ADM Jabalpur v. Shivkant Shukla","(1976) 2 SCC 521",1976,"Constitutional Law","Emergency and Article 21","Habeas corpus suspended during Emergency (expressly overruled in Puttaswamy, 2017)"),
("Maneka Gandhi v. Union of India","(1978) 1 SCC 248",1978,"Constitutional Law","Article 21","Procedure under Article 21 must be just, fair and reasonable; Articles 14, 19 and 21 read together"),
("Minerva Mills v. Union of India","(1980) 3 SCC 625",1980,"Constitutional Law","Basic structure","Limited amending power and the balance between Parts III and IV are basic features"),
("E.P. Royappa v. State of Tamil Nadu","(1974) 4 SCC 3",1974,"Constitutional Law","Equality","Arbitrariness is the antithesis of equality under Article 14"),
("State of West Bengal v. Anwar Ali Sarkar","AIR 1952 SC 75",1952,"Constitutional Law","Equality","Reasonable classification test: intelligible differentia with a rational nexus to the object"),
("Hussainara Khatoon v. State of Bihar","(1980) 1 SCC 81",1979,"Constitutional Law","Article 21","Speedy trial is part of Article 21; release of undertrials detained too long"),
("Olga Tellis v. Bombay Municipal Corporation","(1985) 3 SCC 545",1985,"Constitutional Law","Article 21","Right to livelihood is part of the right to life; eviction needs fair procedure"),
("M.C. Mehta v. Union of India (Oleum Gas Leak)","(1987) 1 SCC 395",1986,"Constitutional Law","Environment and Article 21","Absolute liability for hazardous industries"),
("S.P. Gupta v. Union of India","1981 Supp SCC 87",1981,"Constitutional Law","Judiciary and PIL","First Judges case: relaxed locus standi for PIL; executive primacy in appointments (later reversed)"),
("Supreme Court Advocates-on-Record Assn. v. Union of India","(1993) 4 SCC 441",1993,"Constitutional Law","Judiciary","Second Judges case: primacy of the Chief Justice and collegium in judicial appointments"),
("Supreme Court Advocates-on-Record Assn. v. Union of India (NJAC)","(2016) 5 SCC 1",2015,"Constitutional Law","Judiciary","NJAC and the 99th Amendment struck down as violating judicial independence"),
("Indra Sawhney v. Union of India","1992 Supp (3) SCC 217",1992,"Constitutional Law","Equality and reservation","27% OBC quota upheld; creamy layer excluded; 50% ceiling; no reservation in promotions"),
("S.R. Bommai v. Union of India","(1994) 3 SCC 1",1994,"Constitutional Law","Federalism","Article 356 proclamations are judicially reviewable; floor test; secularism is basic structure"),
("Vishaka v. State of Rajasthan","(1997) 6 SCC 241",1997,"Constitutional Law","Gender equality","Guidelines against workplace sexual harassment, drawing on CEDAW"),
("I.R. Coelho v. State of Tamil Nadu","(2007) 2 SCC 1",2007,"Constitutional Law","Ninth Schedule","Laws placed in the Ninth Schedule after 24.4.1973 are open to basic-structure review"),
("Shreya Singhal v. Union of India","(2015) 5 SCC 1",2015,"Constitutional Law","Free speech","Section 66A IT Act struck down as vague and overbroad"),
("Justice K.S. Puttaswamy v. Union of India","(2017) 10 SCC 1",2017,"Constitutional Law","Privacy","Privacy is a fundamental right under Article 21 and Part III"),
("Navtej Singh Johar v. Union of India","(2018) 10 SCC 1",2018,"Constitutional Law","Equality and dignity","Section 377 IPC read down; consensual adult same-sex relations decriminalised"),
("Joseph Shine v. Union of India","(2019) 3 SCC 39",2018,"Constitutional Law","Equality and dignity","Adultery (s.497 IPC) struck down"),
("Shayara Bano v. Union of India","(2017) 9 SCC 1",2017,"Constitutional Law","Personal law","Instant triple talaq set aside"),
("Anuradha Bhasin v. Union of India","(2020) 3 SCC 637",2020,"Constitutional Law","Free speech","Internet shutdowns must be proportionate, temporary and published"),
("Janhit Abhiyan v. Union of India","(2023) 5 SCC 1",2022,"Constitutional Law","Equality and reservation","103rd Amendment (10% EWS reservation) upheld 3:2"),
("In re Article 370 of the Constitution","",2023,"Constitutional Law","Federalism","Abrogation of Article 370 upheld; Article 370 was a temporary provision"),
("Association for Democratic Reforms v. Union of India (Electoral Bonds)","",2024,"Constitutional Law","Right to information","Electoral bond scheme struck down for violating voters' right to information"),
("Supriyo Chakraborty v. Union of India","",2023,"Constitutional Law","Equality and dignity","No fundamental right to marry; recognising same-sex marriage left to Parliament"),
# Administrative law
("A.K. Kraipak v. Union of India","(1969) 2 SCC 262",1969,"Administrative Law","Natural justice","Natural justice applies to administrative action; no one should judge their own cause"),
("Ridge v. Baldwin","[1964] AC 40",1963,"Administrative Law","Natural justice","Dismissal without a hearing is void; revived the right to be heard"),
("Union of India v. Tulsiram Patel","(1985) 3 SCC 398",1985,"Administrative Law","Natural justice","Article 311(2) second proviso can exclude a hearing in specified cases"),
("Council of Civil Service Unions v. Minister for the Civil Service","[1985] AC 374",1984,"Administrative Law","Judicial review","Grounds of review: illegality, irrationality, procedural impropriety (GCHQ case)"),
("Associated Provincial Picture Houses v. Wednesbury Corporation","[1948] 1 KB 223",1947,"Administrative Law","Judicial review","Wednesbury unreasonableness: a decision no reasonable authority could reach"),
("Om Kumar v. Union of India","(2001) 2 SCC 386",2000,"Administrative Law","Proportionality","Proportionality applies where fundamental freedoms are restricted"),
("Tata Cellular v. Union of India","(1994) 6 SCC 651",1994,"Administrative Law","Government contracts","Limited judicial review of tender decisions: process, not merits"),
("L. Chandra Kumar v. Union of India","(1997) 3 SCC 261",1997,"Administrative Law","Tribunals","High Court review of tribunal decisions under Articles 226/227 is basic structure"),
# Criminal law (BNS)
("K.M. Nanavati v. State of Maharashtra","AIR 1962 SC 605",1961,"Criminal Law","Provocation","Grave and sudden provocation; cooling time defeats the exception"),
("Virsa Singh v. State of Punjab","AIR 1958 SC 465",1958,"Criminal Law","Murder","Test for clause 'thirdly': intended bodily injury sufficient in the ordinary course to cause death"),
("State of Andhra Pradesh v. Rayavarapu Punnayya","(1976) 4 SCC 382",1976,"Criminal Law","Murder","Explains the difference between culpable homicide and murder"),
("Bachan Singh v. State of Punjab","(1980) 2 SCC 684",1980,"Criminal Law","Sentencing","Death penalty only in the rarest of rare cases"),
("Machhi Singh v. State of Punjab","(1983) 3 SCC 470",1983,"Criminal Law","Sentencing","Categories for identifying rarest of rare cases"),
("Barendra Kumar Ghosh v. Emperor","AIR 1925 PC 1",1924,"Criminal Law","Joint liability","Those who also serve who stand and wait: common intention liability"),
("Mahboob Shah v. Emperor","AIR 1945 PC 118",1945,"Criminal Law","Joint liability","Common intention needs a prearranged plan, which may form on the spot"),
("Abhayanand Mishra v. State of Bihar","AIR 1961 SC 1698",1961,"Criminal Law","Attempt","Attempt begins when preparation ends and an act towards the offence is done"),
("State of Maharashtra v. M.H. George","AIR 1965 SC 722",1964,"Criminal Law","Mens rea","Mens rea can be excluded by statute; ignorance of law no defence"),
("Dahyabhai Chhaganbhai Thakker v. State of Gujarat","AIR 1964 SC 1563",1964,"Criminal Law","Insanity","Accused must prove legal insanity on a balance of probabilities"),
("Basdev v. State of PEPSU","AIR 1956 SC 488",1956,"Criminal Law","Intoxication","Drunk person is presumed to have the knowledge of a sober person"),
("Tukaram v. State of Maharashtra (Mathura case)","(1979) 2 SCC 143",1978,"Criminal Law","Sexual offences","Acquittal for want of resistance; triggered the 1983 rape law reforms"),
("Independent Thought v. Union of India","(2017) 10 SCC 800",2017,"Criminal Law","Sexual offences","Marital rape exception read down for wives aged 15 to 18"),
("Aveek Sarkar v. State of West Bengal","(2014) 4 SCC 257",2014,"Criminal Law","Obscenity","Hicklin test replaced with a community standards test"),
("Alister Anthony Pareira v. State of Maharashtra","(2012) 2 SCC 648",2012,"Criminal Law","Negligent driving","Drunk driving deaths can be culpable homicide with knowledge"),
("Jacob Mathew v. State of Punjab","(2005) 6 SCC 1",2005,"Criminal Law","Medical negligence","Doctors are criminally liable only for gross negligence"),
("Gian Kaur v. State of Punjab","(1996) 2 SCC 648",1996,"Criminal Law","Suicide","Right to life does not include the right to die; s.309 IPC upheld"),
("Common Cause v. Union of India","(2018) 5 SCC 1",2018,"Criminal Law","Euthanasia","Passive euthanasia and living wills recognised under Article 21"),
# Criminal procedure (BNSS)
("Lalita Kumari v. Government of Uttar Pradesh","(2014) 2 SCC 1",2013,"Criminal Procedure","FIR","Registration of FIR is mandatory for cognizable offences; preliminary inquiry only in listed cases"),
("Arnesh Kumar v. State of Bihar","(2014) 8 SCC 273",2014,"Criminal Procedure","Arrest","No routine arrest for offences up to 7 years; s.41/41A checklist (now s.35 BNSS)"),
("D.K. Basu v. State of West Bengal","(1997) 1 SCC 416",1996,"Criminal Procedure","Arrest","Arrest and custody safeguards; compensation for custodial violence"),
("Joginder Kumar v. State of U.P.","(1994) 4 SCC 260",1994,"Criminal Procedure","Arrest","Power to arrest must be justified; arrested person can have someone informed"),
("Gurbaksh Singh Sibbia v. State of Punjab","(1980) 2 SCC 565",1980,"Criminal Procedure","Anticipatory bail","Anticipatory bail provisions must be read liberally, without rigid conditions"),
("Sushila Aggarwal v. State (NCT of Delhi)","(2020) 5 SCC 1",2020,"Criminal Procedure","Anticipatory bail","Anticipatory bail need not be time-limited and can last till trial ends"),
("Satender Kumar Antil v. CBI","(2022) 10 SCC 51",2022,"Criminal Procedure","Bail","Bail categories and guidelines; bail is the rule"),
("State of Haryana v. Bhajan Lal","1992 Supp (1) SCC 335",1990,"Criminal Procedure","Quashing","Seven categories where FIRs can be quashed under inherent powers"),
("Gian Singh v. State of Punjab","(2012) 10 SCC 303",2012,"Criminal Procedure","Quashing","High Court can quash non-compoundable cases after settlement in private disputes"),
("Zahira Habibullah Sheikh v. State of Gujarat","(2004) 4 SCC 158",2004,"Criminal Procedure","Fair trial","Best Bakery case: retrial and transfer to secure a fair trial"),
("Sakiri Vasu v. State of U.P.","(2008) 2 SCC 409",2007,"Criminal Procedure","Investigation","Magistrate can order registration and proper investigation under s.156(3)"),
("Kartar Singh v. State of Punjab","(1994) 3 SCC 569",1994,"Criminal Procedure","Special laws","TADA upheld with safeguards"),
("Vijay Madanlal Choudhary v. Union of India","2022 SCC OnLine SC 929",2022,"Criminal Procedure","Special laws","PMLA arrest, search and bail provisions upheld"),
# Evidence (BSA)
("Pakala Narayana Swami v. Emperor","AIR 1939 PC 47",1939,"Evidence","Dying declaration","Statements about circumstances of death are relevant as dying declarations"),
("Sharad Birdhichand Sarda v. State of Maharashtra","(1984) 4 SCC 116",1984,"Evidence","Circumstantial evidence","Five golden principles for conviction on circumstantial evidence"),
("Pulukuri Kottaya v. Emperor","AIR 1947 PC 67",1946,"Evidence","Confessions","Only the part of a statement that distinctly leads to discovery is admissible"),
("Anvar P.V. v. P.K. Basheer","(2014) 10 SCC 473",2014,"Evidence","Electronic evidence","Electronic records need a s.65B certificate"),
("Arjun Panditrao Khotkar v. Kailash Kushanrao Gorantyal","(2020) 7 SCC 1",2020,"Evidence","Electronic evidence","The s.65B(4) certificate is mandatory for secondary electronic evidence"),
("Selvi v. State of Karnataka","(2010) 7 SCC 263",2010,"Evidence","Self-incrimination","Narco-analysis, polygraph and BEAP without consent violate Article 20(3)"),
("State of Bombay v. Kathi Kalu Oghad","AIR 1961 SC 1808",1961,"Evidence","Self-incrimination","Giving specimen handwriting or fingerprints is not testimonial compulsion"),
("Tomaso Bruno v. State of U.P.","(2015) 7 SCC 178",2015,"Evidence","Best evidence","Failure to produce CCTV footage can lead to an adverse inference"),
# Civil procedure
("Satyadhyan Ghosal v. Deorajin Debi","AIR 1960 SC 941",1960,"Civil Procedure","Res judicata","Res judicata applies between different stages of the same proceeding"),
("Kiran Singh v. Chaman Paswan","AIR 1954 SC 340",1954,"Civil Procedure","Jurisdiction","A decree without inherent jurisdiction is a nullity, but valuation defects are curable"),
("Salem Advocate Bar Association v. Union of India","(2005) 6 SCC 344",2005,"Civil Procedure","CPC amendments","Upheld 1999/2002 CPC amendments; guidelines on ADR under s.89"),
("Afcons Infrastructure v. Cherian Varkey Construction","(2010) 8 SCC 24",2010,"Civil Procedure","ADR","How courts should refer cases under s.89 CPC"),
("Dhulabhai v. State of Madhya Pradesh","AIR 1969 SC 78",1968,"Civil Procedure","Jurisdiction","Principles on when civil court jurisdiction is excluded by statute"),
("Gurbux Singh v. Bhooralal","AIR 1964 SC 1810",1964,"Civil Procedure","Order 2 Rule 2","Same cause of action must be pleaded together; later suit barred"),
("Sangram Singh v. Election Tribunal","AIR 1955 SC 425",1955,"Civil Procedure","Procedure","Procedure is the handmaid of justice; ex parte rules read reasonably"),
# Contract
("Mohori Bibee v. Dharmodas Ghose","(1903) 30 IA 114",1903,"Contract","Capacity","A minor's agreement is void ab initio"),
("Lalman Shukla v. Gauri Dutt","(1913) 11 ALJ 489",1913,"Contract","Offer and acceptance","No acceptance without knowledge of the offer"),
("Carlill v. Carbolic Smoke Ball Co","[1893] 1 QB 256",1892,"Contract","Offer and acceptance","A general offer can be accepted by performing its conditions"),
("Harvey v. Facey","[1893] AC 552",1893,"Contract","Offer and acceptance","Stating a lowest price is information, not an offer"),
("Bhagwandas Goverdhandas Kedia v. Girdharilal Parshottamdas","AIR 1966 SC 543",1966,"Contract","Offer and acceptance","Contract by telephone is formed where acceptance is heard"),
("Satyabrata Ghose v. Mugneeram Bangur","AIR 1954 SC 44",1953,"Contract","Frustration","Section 56 covers impracticability, but temporary requisition did not frustrate"),
("Hadley v. Baxendale","(1854) 9 Exch 341",1854,"Contract","Damages","Damages limited to losses arising naturally or in the parties' contemplation"),
("Chinnaya v. Ramayya","(1882) ILR 4 Mad 137",1881,"Contract","Consideration","Consideration may move from a third party"),
("Abdul Aziz v. Masum Ali","AIR 1914 All 22",1914,"Contract","Consideration","Promise to subscribe to a mosque fund unenforceable without detriment"),
("Gherulal Parakh v. Mahadeodas Maiya","AIR 1959 SC 781",1959,"Contract","Legality","Wagering contracts are void but not illegal; collateral contracts are enforceable"),
("ONGC v. Saw Pipes","(2003) 5 SCC 705",2003,"Contract","Liquidated damages","Liquidated damages that are a genuine pre-estimate can be awarded without proof of loss"),
("Kailash Nath Associates v. DDA","(2015) 4 SCC 136",2015,"Contract","Liquidated damages","Damages under s.74 need proof of legal injury; reasonable compensation only"),
("Central Inland Water Transport Corp. v. Brojo Nath Ganguly","(1986) 3 SCC 156",1986,"Contract","Unconscionable terms","Unconscionable terms in contracts with unequal bargaining power are void under s.23"),
# Torts
("Donoghue v. Stevenson","[1932] AC 562",1932,"Torts","Negligence","Neighbour principle: duty to those closely and directly affected"),
("Rylands v. Fletcher","(1868) LR 3 HL 330",1868,"Torts","Strict liability","Liability for escape of dangerous things from non-natural use of land"),
("Kasturilal Ralia Ram Jain v. State of U.P.","AIR 1965 SC 1039",1965,"Torts","State liability","No State liability for sovereign functions"),
("Rudul Sah v. State of Bihar","(1983) 4 SCC 141",1983,"Torts","Constitutional torts","Compensation under Article 32 for illegal detention"),
("Nilabati Behera v. State of Orissa","(1993) 2 SCC 746",1993,"Torts","Constitutional torts","Public law compensation for custodial death; sovereign immunity no defence"),
("Indian Medical Association v. V.P. Shantha","(1995) 6 SCC 651",1995,"Torts","Medical negligence","Medical services are 'services' under consumer law"),
("Union Carbide Corporation v. Union of India","(1991) 4 SCC 584",1991,"Torts","Mass torts","Bhopal settlement upheld; criminal immunity part set aside"),
# Family law
("Saroj Rani v. Sudarshan Kumar Chadha","(1984) 4 SCC 90",1984,"Family Law","Restitution of conjugal rights","Section 9 HMA upheld as constitutional"),
("Sarla Mudgal v. Union of India","(1995) 3 SCC 635",1995,"Family Law","Bigamy","Conversion to Islam to remarry does not end the first marriage"),
("Mohd. Ahmed Khan v. Shah Bano Begum","(1985) 2 SCC 556",1985,"Family Law","Maintenance","Divorced Muslim wife can claim maintenance under s.125 CrPC"),
("Danial Latifi v. Union of India","(2001) 7 SCC 740",2001,"Family Law","Maintenance","1986 Act upheld; fair provision extends beyond iddat"),
("Vineeta Sharma v. Rakesh Sharma","(2020) 9 SCC 1",2020,"Family Law","Succession","Daughters are coparceners by birth, whether or not the father was alive in 2005"),
("V. Tulasamma v. Sesha Reddy","(1977) 3 SCC 99",1977,"Family Law","Succession","Limited estate in lieu of maintenance becomes absolute under s.14(1) HSA"),
("Githa Hariharan v. Reserve Bank of India","(1999) 2 SCC 228",1999,"Family Law","Guardianship","Mother can act as natural guardian in father's absence"),
("Shilpa Sailesh v. Varun Sreenivasan","",2023,"Family Law","Divorce","Supreme Court can grant divorce on irretrievable breakdown under Article 142"),
("Rajnesh v. Neha","(2021) 2 SCC 324",2020,"Family Law","Maintenance","Guidelines on interim maintenance and affidavits of disclosure"),
("Shabnam Hashmi v. Union of India","(2014) 4 SCC 1",2014,"Family Law","Adoption","Any person can adopt under the Juvenile Justice Act"),
# Property / TPA
("Suraj Lamp & Industries v. State of Haryana","(2012) 1 SCC 656",2011,"Property Law","Sale","GPA sales, agreements to sell and wills do not transfer title"),
("Associated Hotels of India v. R.N. Kapoor","AIR 1959 SC 1262",1959,"Property Law","Lease and licence","Whether a lease or licence depends on substance and intention"),
("Ravinder Kaur Grewal v. Manjit Kaur","(2019) 8 SCC 729",2019,"Property Law","Adverse possession","A person who perfects title by adverse possession can sue to protect it"),
("Jumma Masjid v. Kodimaniandra Deviah","AIR 1962 SC 847",1962,"Property Law","Feeding the grant","Section 43 TPA applies to transfers of spes successionis for consideration"),
("Tulk v. Moxhay","(1848) 41 ER 1143",1848,"Property Law","Covenants","Negative covenants bind purchasers with notice"),
("Dhanpal Chettiar v. Yesodai Ammal","(1979) 4 SCC 214",1979,"Property Law","Lease","No notice under s.106 TPA needed for eviction under rent control laws"),
("Ganga Dhar v. Shankar Lal","AIR 1958 SC 770",1958,"Property Law","Mortgage","A term postponing redemption for 85 years was not a clog on equity"),
# Company / commercial
("Salomon v. A. Salomon & Co","[1897] AC 22",1896,"Company Law","Corporate personality","A company is a separate legal person from its members"),
("Vodafone International Holdings v. Union of India","(2012) 6 SCC 613",2012,"Company Law","Tax","Offshore share transfer not taxable in India (later retrospective amendment)"),
("Swiss Ribbons v. Union of India","(2019) 4 SCC 17",2019,"Company Law","Insolvency","Insolvency and Bankruptcy Code upheld"),
("Tata Consultancy Services v. Cyrus Investments","(2021) 9 SCC 449",2021,"Company Law","Oppression","Cyrus Mistry's removal was not oppression or mismanagement"),
("Bharat Aluminium Co. v. Kaiser Aluminium","(2012) 9 SCC 552",2012,"Arbitration","Seat","Part I of the 1996 Act does not apply to foreign-seated arbitrations (BALCO)"),
("Perkins Eastman Architects v. HSCC","(2020) 20 SCC 760",2019,"Arbitration","Appointment","An interested party cannot unilaterally appoint the sole arbitrator"),
("In re Interplay between Arbitration Agreements and the Stamp Act","",2023,"Arbitration","Stamp duty","Unstamped arbitration agreements are not void; stamping is curable"),
# IPR
("Novartis AG v. Union of India","(2013) 6 SCC 1",2013,"Intellectual Property","Patents","Section 3(d) bars patents for new forms without enhanced therapeutic efficacy"),
("Eastern Book Company v. D.B. Modak","(2008) 1 SCC 1",2007,"Intellectual Property","Copyright","Originality needs a minimal degree of creativity"),
("R.G. Anand v. Delux Films","(1978) 4 SCC 118",1978,"Intellectual Property","Copyright","No copyright in ideas; test of substantial copying of expression"),
("Cadila Health Care v. Cadila Pharmaceuticals","(2001) 5 SCC 73",2001,"Intellectual Property","Trade marks","Factors for deceptive similarity, stricter for medicines"),
("N.R. Dongre v. Whirlpool Corporation","(1996) 5 SCC 714",1996,"Intellectual Property","Trade marks","Trans-border reputation protected in passing off"),
# Labour
("Bangalore Water Supply v. A. Rajappa","(1978) 2 SCC 213",1978,"Labour Law","Industry","Triple test for 'industry' under the Industrial Disputes Act"),
("Secretary, State of Karnataka v. Umadevi","(2006) 4 SCC 1",2006,"Labour Law","Regularisation","No regularisation of irregular appointees as of right"),
# Environment
("Vellore Citizens' Welfare Forum v. Union of India","(1996) 5 SCC 647",1996,"Environmental Law","Principles","Precautionary and polluter-pays principles are part of Indian law"),
("M.C. Mehta v. Kamal Nath","(1997) 1 SCC 388",1996,"Environmental Law","Public trust","Public trust doctrine applies to natural resources"),
("T.N. Godavarman Thirumulpad v. Union of India","(1997) 2 SCC 267",1996,"Environmental Law","Forests","'Forest' read in its dictionary sense for the Forest Conservation Act"),
("Subhash Kumar v. State of Bihar","(1991) 1 SCC 598",1991,"Environmental Law","Article 21","Right to pollution-free water and air is part of Article 21"),
]

def main():
    db = load()
    n = 0
    for name, cite, year, subject, topic, tag in L:
        if add(db, dict(name=name, cite=cite, year=year, court=court_of(cite), subjects=[subject], topic=topic,
                        tag=tag, kind="landmark")):
            n += 1
    save(db)
    print(f"added {n} landmark cases; total {len(db['cases'])}")

def court_of(cite):
    if any(x in cite for x in ["AC", "QB", "KB", "Exch", "ER", "Ch D", "LR 3"]):
        return "UK courts"
    if "PC" in cite or "IA" in cite:
        return "Privy Council"
    if "All" in cite and "ALJ" not in cite and "SC" not in cite: return "Allahabad High Court"
    if "ALJ" in cite: return "Allahabad High Court"
    if "Mad" in cite: return "Madras High Court"
    return "Supreme Court of India"

if __name__ == "__main__":
    main()
