class A(object):
    def say(self):
        super().say()
        print('a...')


class B(object):
    def say(self):
        # super().say()
        print('b...')


# class C(A):
# class C(B,A):
class C(A,B):
    # def say(self):
    #     super().say()
    #     print('b...')

    pass


if __name__ == '__main__':
    c = C()
    c.say()

    # b=B()
    # b.say()
