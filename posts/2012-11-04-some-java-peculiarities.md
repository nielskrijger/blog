# Some Java peculiarities

Currently I'm sharpening my Java skills for the OCP Java Programmer SE 6 exam (formarly SCJP). While I'm not thrilled about taking exames, preparing for this one turned out to be lots of fun! I wrote some code examples to show some of the peculiarities of Java that made me raise my eyebrows.

### Integer wrapper caching

    public class A
    {
        public static void main(String[] args)
        {
            checkSimilarityInteger(127);
            System.out.println("------");
            checkSimilarityInteger(128);
        }

        public static void checkSimilarityInteger(int i)
        {
            Integer i1 = i;
            Integer i2 = i;
            if (i1 == i2) {
                System.out.println("Integer "+i+" == Integer "+i);
            } else {
                System.out.println("Integer "+i+" != Integer "+i);
            }
            if (i1.equals(i2)) {
                System.out.println("Integer "+i+" equals Integer "+i);
            } else {
                System.out.println("Integer "+i+" does NOT equal Integer "+i);
            }
        }
    }

Output:

	Integer 127 == Integer 127
	Integer 127 equals Integer 127
	------
	Integer 128 != Integer 128
	Integer 128 equals Integer 128

*Why*: Integers from -128 to 127 are being cached.

### Switch default case

    public class A
    {
        public static void main(String[] args)
        {
            switch (7) 
            {
                default:
                    System.out.println("Default");
                    break;
                case 7:
                    System.out.println("7");
                    break;
            }
        }
    }

Output:
7

*Why*: I guessed because of a switch's fall-through policy it would match the default first; but it doesn't, it works fine. I wasn't even sure this would compile at all, never put a default in the switch above another case (and never heard of someone who does).

### Pass by reference?

    public class A
    {
        public static void main(String[] args)
        {
            Object x = null;
            populateString(x);
            System.out.println(x);
        }
        
        static void populateString(Object x2)
        {
            x2 = "This is a string";
        }
    }

Output:
null

*Why*: One thing that might suprise you is System.out.print(ln) simply prints 'null' for null references. One thing that might not surprise you, but perhaps should, is x has not been assigned the string "This is a string" because java does not pass by reference. I remember my Java teacher stressing this point a long time ago but I've never appreciated it really until now. With hindsight it felt like you've been trained right without fully understanding why.

### Null array reference and evaluation

    public class A
    {
        public static void main(String[] args)
        {
            int i = 1;
            try {
                getArray()[i = 2]++;
            } catch (Exception e) {
            }  
            System.out.println("i = " + i);
            
            int j = 1;
            try {
                getDoubleArray()[getIntAndFail()][j = 2]++;
            } catch (Exception e) {
            }  
            System.out.println("j = " + j);
        }
        
        public static int[] getArray()
        {
            return null;
        }
        
        public static int[][] getDoubleArray()
        {
            return null;
        }
        
        public static int getIntAndFail() throws Exception
        {
            if (true) throw new Exception("I failed");
            return 0;
        }
    }

Output:

	i = 2
	j = 1

*Why*: In the first part of main() the getArray() causes a NullPointerException. This NullPointerException will not be detected until after the other operations within the array reference are evaluated. Hence, the assignment i = 2 will be completed before the NullPointerException is thrown. In the second part of main() the getDoubleArray() also causes a NullPointerException but before the assignment i = 2 is evaluated another Exception is thrown. This Exception does halt the whole evaluation immediately and prevents i = 2 from being evaluated.

### Null array reference and evaluation

    "String".replace('g','g') == new String("String").replace('g','g')
    "String".replace('g','G') == "StrinG"
    "String".replace('g','g') == "String"

Output:

	false
	false
	true

*Why*: Java's string interning behavior can be confusing. In this case any normal human being would at least expect all three methods return the same value (all true or false). When you're aware java Strings can be interned (= cached within a lookup table) you start thinking. All strings created in the language syntax "String" are automatically interned, whereas new String("String") is not. Once you know this you can deduce "String".replace('g','g') == new String("String").replace('g','g') returns false. The next step is to know what .replace(...) does. What it does is return a new String object (in fact it has to; strings are immutable). With this knowledge you'd expect all three equations to return false. If live were just that simple. When replace(...) doesn't have to do anything it returns the same object (quite logical), but this has the nasty side-effect the last expression yields true rather than false. Puzzling.